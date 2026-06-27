const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const getOverview = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    revenueByDay,
    ordersByStatus,
    topCategories,
    recentOrders,
    productCounts,
  ] = await Promise.all([
    // Revenue per day for last 30 days (paid orders only)
    Order.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
    ]),

    // Order counts by status
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Top categories by revenue and count
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          count: { $sum: 1 },
          revenue: { $sum: '$items.salePrice' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
      { $project: { category: '$_id', count: 1, revenue: 1, _id: 0 } },
    ]),

    // Recent 10 paid orders
    Order.find({ status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(10)
      .select('customer.name totalAmount paidAt items')
      .lean(),

    // Product status counts
    Product.aggregate([
      { $match: { archived: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Build status map
  const statusMap = { paid: 0, pending: 0, failed: 0, refunded: 0 };
  ordersByStatus.forEach(({ _id, count }) => { if (_id in statusMap) statusMap[_id] = count; });

  // Build product count map
  const productMap = { available: 0, reserved: 0, sold: 0 };
  productCounts.forEach(({ _id, count }) => { if (_id in productMap) productMap[_id] = count; });

  const totalRevenue = revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const conversionRate = totalOrders > 0
    ? Number(((statusMap.paid / totalOrders) * 100).toFixed(1))
    : 0;

  res.json({
    revenueByDay,
    ordersByStatus: statusMap,
    topCategories,
    recentOrders,
    productCounts: productMap,
    totalRevenue,
    totalOrders,
    conversionRate,
  });
});

module.exports = { getOverview };
