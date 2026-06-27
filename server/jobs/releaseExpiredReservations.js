const Product = require("../models/Product");
const Order = require("../models/Order");

async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  const expired = await Product.find({
    status: "reserved",
    reservedAt: { $lt: cutoff }
  }).select("_id");

  if (expired.length === 0) return { released: 0 };

  const ids = expired.map((p) => p._id);

  await Product.updateMany(
    { _id: { $in: ids } },
    { $set: { status: "available" }, $unset: { reservedAt: "", reservedOrderId: "" } }
  );

  await Order.updateMany(
    { productId: { $in: ids }, status: "pending" },
    { $set: { status: "failed" } }
  );

  return { released: ids.length };
}

module.exports = { releaseExpiredReservations };
