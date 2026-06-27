const Razorpay = require("razorpay");

let client;

function makeMockClient() {
  return {
    payments: {
      refund: async (paymentId, opts) => {
        return { id: `mock_refund_${paymentId}`, refunded: true, amount: opts?.amount || 0 };
      }
    },
    orders: {
      create: async (opts) => ({ id: `mock_order_${Date.now()}`, amount: opts.amount })
    }
  };
}

function getRazorpayClient() {
  const allowMock = process.env.MOCK_RAZORPAY === "true" && process.env.NODE_ENV !== "production";
  if (allowMock) {
    if (!client) client = makeMockClient();
    return client;
  }

  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || ""
    });
  }
  return client;
}

module.exports = { getRazorpayClient };
