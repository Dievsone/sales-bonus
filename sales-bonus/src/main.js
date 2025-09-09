// filepath: sales-bonus/sales-bonus/src/main.js
/**
 * Функция расчёта выручки по одной позиции в чеке
 * @param {Object} purchase — объект покупки из чека (items)
 * @param {Object} _product — объект товара из каталога (data.products)
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
  const discountRate = 1 - discount / 100;
  const revenue = sale_price * quantity * discountRate;
  return +revenue.toFixed(2);
}

/**
 * Функция расчёта бонуса продавца по позиции в рейтинге
 * @param {number} index — позиция в рейтинге (0 — первый)
 * @param {number} total — всего продавцов
 * @param {Object} seller — объект с данными продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  let pct = 0;

  if (index === 0) pct = 0.15;
  else if (index === 1 || index === 2) pct = 0.1;
  else if (index === total - 1) pct = 0;
  else pct = 0.05;

  const bonus = profit * pct;
  return +bonus.toFixed(2);
}

/**
 * Главная функция анализа данных продаж
 * @param {Object} data — исходные данные
 * @param {Object} options — объект с функциями расчёта
 * @returns {Array}
 */
function analyzeSalesData(data, options) {
  // --- Проверка входных данных ---
  if (
    !data ||
    !Array.isArray(data.sellers) || data.sellers.length === 0 ||
    !Array.isArray(data.products) || data.products.length === 0 ||
    !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
  ) {
    throw new Error('Некорректные входные данные');
  }

  // --- Проверка опций ---
  if (!options || !options.calculateRevenue || !options.calculateBonus) {
    throw new Error('Нет функций для расчётов');
  }

  const { calculateRevenue, calculateBonus } = options;

  // --- Подготовка промежуточных данных ---
  const sellerStats = data.sellers.map(seller => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
  }));

  // Индексы для быстрого доступа
  const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
  const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

  // --- Основная логика: обход чеков и товаров ---
  data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count++;

    record.items.forEach(item => {
      const product = productIndex[item.sku];
      if (!product) return;

      const itemRevenue = calculateRevenue(item, product);
      const cost = product.purchase_price * item.quantity;
      const itemProfit = itemRevenue - cost;

      seller.revenue += itemRevenue;
      seller.profit += itemProfit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // --- Сортировка по прибыли ---
  sellerStats.sort((a, b) => b.profit - a.profit);

  // --- Назначение бонусов и топ-10 товаров ---
  sellerStats.forEach((seller, index) => {
    seller.revenue = +seller.revenue.toFixed(2);
    seller.profit = +seller.profit.toFixed(2);
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    delete seller.products_sold;
  });

  return sellerStats;
}