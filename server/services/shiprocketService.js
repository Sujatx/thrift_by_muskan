const axios = require('axios');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;

async function authenticate() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are required');
  }

  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  cachedToken = response.data.token;
  // Cache for 9 days (tokens are valid for 10 days)
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

function buildOrderPayload(order) {
  const customer = order.customer || {};
  const address = order.address || {};
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : [{ name: order.productName || 'Item', salePrice: order.salePrice || 0, quantity: 1 }];

  return {
    order_id: order._id.toString(),
    order_date: (order.paidAt || order.createdAt || new Date()).toISOString().slice(0, 10),
    pickup_location: 'Primary',
    billing_customer_name: customer.name || '',
    billing_last_name: '',
    billing_address: address.line1 || '',
    billing_address_2: address.line2 || '',
    billing_city: address.city || '',
    billing_pincode: address.pincode || '',
    billing_state: address.state || '',
    billing_country: 'India',
    billing_email: customer.email || '',
    billing_phone: customer.phone || '',
    shipping_is_billing: true,
    order_items: items.map((item, idx) => ({
      name: item.name || `Item ${idx + 1}`,
      sku: item.productId ? item.productId.toString() : `sku-${idx}`,
      units: Number(item.quantity || 1),
      selling_price: Number(item.salePrice || 0),
    })),
    payment_method: 'Prepaid',
    sub_total: Number(order.totalAmount || order.salePrice || 0),
    length: 20,
    breadth: 15,
    height: 5,
    weight: 0.5,
  };
}

async function createShiprocketOrder(order) {
  try {
    const token = await authenticate();
    const payload = buildOrderPayload(order);

    const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data || {};
    return {
      shiprocketOrderId: String(data.order_id || ''),
      shipmentId: String(data.shipment_id || ''),
      awbCode: String(data.awb_code || ''),
      courierName: String(data.courier_name || ''),
      trackingUrl: data.awb_code
        ? `https://shiprocket.co/tracking/${data.awb_code}`
        : '',
      status: 'created',
    };
  } catch (err) {
    console.error('[Shiprocket] createShiprocketOrder failed:', err?.response?.data || err.message);
    return null;
  }
}

module.exports = { createShiprocketOrder };
