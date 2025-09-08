/**
 * Функция для расчета выручки (сумма продаж после скидки)
 * @param item товар в чеке
 * @param product карточка товара (не используется, но нужен для совместимости)
 * @returns {number}
 */
function calculateSimpleRevenue(item, product) {
    let priceAfterDiscount = item.sale_price * (1 - item.discount / 100);
    return priceAfterDiscount * item.quantity;
}

/**
 * Функция для расчета бонусов
 * @param index место продавца
 * @param total всего продавцов
 * @param seller данные продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return Number((seller.profit * 0.15).toFixed(2));
    } else if (index === 1 || index === 2) {
        return Number((seller.profit * 0.10).toFixed(2));
    } else if (index === total - 1) {
        return 0;
    } else {
        return Number((seller.profit * 0.05).toFixed(2));
    }
}

/**
 * Функция для анализа данных продаж
 * @param data все данные
 * @param options функции для расчетов
 * @returns {Array}
 */
function analyzeSalesData(data, options) {
    // проверки входных данных
    if (!data || !data.customers || !data.products || !data.sellers || !data.purchase_records) {
        throw new Error("Ошибка: данные не полные!");
    }
    if (!options || !options.calculateRevenue || !options.calculateBonus) {
        throw new Error("Ошибка: нет функций для расчетов!");
    }
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error("Ошибка: нет продавцов!");
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("Ошибка: нет товаров!");
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error("Ошибка: нет покупок!");
    }

    let sellersInfo = {};

    // начальные данные по продавцам
    for (let seller of data.sellers) {
        sellersInfo[seller.id] = {
            seller_id: seller.id,
            name: seller.first_name + " " + seller.last_name,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products: {}
        };
    }

    // считаем продажи
    for (let record of data.purchase_records) {
        let sellerId = record.seller_id;
        if (!sellersInfo[sellerId]) continue;

        sellersInfo[sellerId].sales_count++;

        for (let item of record.items) {
            let product = data.products.find(p => p.sku === item.sku);
            if (!product) continue;

            // выручка
            let itemRevenue = options.calculateRevenue(item, product);
            sellersInfo[sellerId].revenue += itemRevenue;

            // прибыль
            let itemProfit = itemRevenue - product.purchase_price * item.quantity;
            sellersInfo[sellerId].profit += itemProfit;

            // статистика по товарам (считаем выручку и количество)
            if (!sellersInfo[sellerId].products[item.sku]) {
                sellersInfo[sellerId].products[item.sku] = { revenue: 0, quantity: 0 };
            }
            sellersInfo[sellerId].products[item.sku].revenue += itemRevenue;
            sellersInfo[sellerId].products[item.sku].quantity += item.quantity;
        }
    }

    // массив продавцов
    let sellersArray = Object.values(sellersInfo);

    // сортировка по прибыли
    sellersArray.sort((a, b) => b.profit - a.profit);

    // бонусы + топ товары
    for (let i = 0; i < sellersArray.length; i++) {
        let seller = sellersArray[i];

        // бонус
        seller.bonus = options.calculateBonus(i, sellersArray.length, seller);

        // топ-10 товаров (по количеству продаж)
        let productList = Object.entries(seller.products).map(([sku, data]) => ({
            sku,
            quantity: data.quantity
        }));

        productList.sort((a, b) => b.quantity - a.quantity);
        seller.top_products = productList.slice(0, 10);

        // финальное округление
        seller.revenue = Number(seller.revenue.toFixed(2));
        seller.profit = Number(seller.profit.toFixed(2));

        delete seller.products;
    }

    return sellersArray;
}
