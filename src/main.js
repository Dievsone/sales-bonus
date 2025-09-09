function to2(num) {
  return +num.toFixed(2);
}

function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
  const disc = discount / 100;
  const full = sale_price * quantity;
  const revenue = full * (1 - disc);
  return revenue;
}

function calculateBonusByProfit(index, total, seller) {
  let pct = 0;
  if (index === 0) pct = 0.15;
  else if (index === 1 || index === 2) pct = 0.10;
  else if (index === total - 1) pct = 0;
  else pct = 0.05;

  const bonus = seller.profit * pct;
  return +bonus.toFixed(2);
}

function analyzeSalesData(data, options) {
  if (!data
      || !Array.isArray(data.sellers)
      || !Array.isArray(data.products)
      || !Array.isArray(data.purchase_records)
  ) {
    throw new Error('Некорректные входные данные');
  }
  if (!options || typeof options !== 'object') {
    throw new Error('Нет опций для расчётов');
  }
  const { calculateRevenue, calculateBonus } = options;
  if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
    throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
  }

  const sellersStats = data.sellers.map(s => ({
    seller_id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
  }));

  const sellerIndex = Object.fromEntries(sellersStats.map(s => [s.seller_id, s]));
  const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

  for (const record of data.purchase_records) {
    const seller = sellerIndex[record.seller_id];
    if (!seller) continue;
    seller.sales_count += 1;

    for (const item of record.items) {
      const product = productIndex[item.sku];
      if (!product) continue;

      const itemRevenueRaw = calculateRevenue(item, product);
      const itemRevenue = +itemRevenueRaw.toFixed(2);

      const cost = product.purchase_price * item.quantity;

      seller.revenue += itemRevenue;
      seller.profit += (itemRevenueRaw - cost);

      if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
      seller.products_sold[item.sku] += item.quantity;
    }
  }

  const sellersArray = sellersStats.sort((a, b) => b.profit - a.profit);

  for (let i = 0; i < sellersArray.length; i++) {
    const s = sellersArray[i];

    s.revenue = to2(s.revenue);
    s.profit = to2(s.profit);

    s.bonus = +calculateBonus(i, sellersArray.length, s).toFixed(2);

    s.top_products = Object.entries(s.products_sold)
      .map(([sku, qty]) => ({ sku, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    delete s.products_sold;
  }
    return sellersArray;
}
