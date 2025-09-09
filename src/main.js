/**
 * Расчет выручки (цена со скидкой × количество)
 * @param {Object} item
 * @param {Object} product
 * @returns {number}
 */
function calculateSimpleRevenue(item, product) {
  const priceAfterDiscount = item.sale_price * (1 - item.discount / 100);
  return priceAfterDiscount * item.quantity;
}

/**
 * Расчет бонуса по месту продавца
 * @param {number} index
 * @param {number} total
 * @param {Object} seller
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  let pct = 0;
  if (index === 0) pct = 0.15;
  else if (index === 1 || index === 2) pct = 0.10;
  else if (index === total - 1) pct = 0;
  else pct = 0.05;

  return +(seller.profit * pct).toFixed(2);
}

/**
 * Анализ данных продаж
 * @param {Object} data
 * @param {Object} options
 * @returns {Array}
 */
function analyzeSalesData(data, options) {
  // Валидация входных данных
  if (!data || !data.customers || !data.products || !data.sellers || !data.purchase_records) {
    throw new Error('Ошибка: данные не полные!');
  }
  if (!options || !options.calculateRevenue || !options.calculateBonus) {
    throw new Error('Ошибка: нет функций для расчетов!');
  }
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error('Ошибка: нет продавцов!');
  }
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error('Ошибка: нет товаров!');
  }
  if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
    throw new Error('Ошибка: нет покупок!');
  }

  // Индекс товаров по SKU
  const productBySku = {};
  for (const p of data.products) productBySku[p.sku] = p;

  // Структура продавцов
  const sellersInfo = {};
  for (const s of data.sellers) {
    sellersInfo[s.id] = {
      seller_id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products: {}
    };
  }

  // Обход всех покупок
  for (const rec of data.purchase_records) {
    const s = sellersInfo[rec.seller_id];
    if (!s) continue;

    s.sales_count++;

    for (const item of rec.items) {
      const product = productBySku[item.sku];
      if (!product) continue;

      // Выручка по позиции
      let itemRevenue = +options.calculateRevenue(item, product).toFixed(2);
      s.revenue += itemRevenue;

      // Прибыль по позиции
      let itemProfit = +(itemRevenue - product.purchase_price * item.quantity).toFixed(2);
      s.profit += itemProfit;

      // Статистика по товарам
      if (!s.products[item.sku]) s.products[item.sku] = { revenue: 0, quantity: 0 };
      s.products[item.sku].revenue += itemRevenue;
      s.products[item.sku].quantity += item.quantity;
    }
  }

  // В массив и сортировка по прибыли
  const sellersArray = Object.values(sellersInfo).sort((a, b) => b.profit - a.profit);

  // Финализация
  for (let i = 0; i < sellersArray.length; i++) {
    const s = sellersArray[i];

    s.revenue = +s.revenue.toFixed(2);
    s.profit = +s.profit.toFixed(2);
    s.bonus = +options.calculateBonus(i, sellersArray.length, s).toFixed(2);

    // Топ-10 товаров
    const top = Object.entries(s.products)
      .map(([sku, v]) => ({ sku, quantity: v.quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    s.top_products = top;
    delete s.products;
  }

  return sellersArray;
}
