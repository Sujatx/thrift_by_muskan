import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const ADMIN_TOKEN_KEY = 'muse_admin_token'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      // Only redirect if NOT already on the login page
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message
    console.error('[v0] API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// Products
export const getProducts = async () => {
  return api.get('/products')
}

export const getProductById = async (id) => {
  return api.get(`/products/${id}`)
}

// Payments (customer checkout)
export const createPaymentOrder = async ({ items, customer, address }) => {
  return api.post('/pay/create-order', { items, customer, address })
}

export const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  orderId,
}) => {
  return api.post('/pay/verify', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId,
  })
}

export const cancelPayment = async (orderId) => {
  return api.post('/pay/cancel', { orderId })
}

// Admin Auth
export const loginAdmin = async (email, password) => {
  return api.post('/admin/login', { email, password })
}

export const forgotAdminPassword = async (email) => {
  return api.post('/admin/forgot-password', { email })
}

export const resetAdminPassword = async (token, password) => {
  return api.post('/admin/reset-password', { token, password })
}

// Admin Products
export const getAdminProducts = async () => {
  return api.get('/admin/products')
}

export const createProduct = async (productData) => {
  return api.post('/admin/products', productData)
}

export const updateProduct = async (id, productData) => {
  return api.put(`/admin/products/${id}`, productData)
}

export const updateProductStatus = async (id, status) => {
  return api.patch(`/admin/products/${id}/status`, { status })
}

export const deleteProduct = async (id) => {
  return api.delete(`/admin/products/${id}`)
}

// Admin Orders
export const getAdminOrders = async (params = {}) => {
  return api.get('/admin/orders', { params })
}

export const getAdminOrder = async (id) => {
  return api.get(`/admin/orders/${id}`)
}

export const getCloudinarySignature = async () => {
  return api.get('/admin/cloudinary-signature')
}

export const updateOrderStatus = async (id, status) => {
  return api.put(`/admin/orders/${id}`, { status })
}

// Public endpoints
export const getStoreSettings = () => api.get('/settings')
export const getPublicBanners = (type) => api.get(`/banners${type ? `?type=${type}` : ''}`)

// Admin analytics
export const getAnalyticsOverview = () => api.get('/admin/analytics/overview')

// Admin banners
export const getAdminBanners = () => api.get('/banners/admin')
export const createBanner = (data) => api.post('/banners/admin', data)
export const updateBanner = (id, data) => api.patch(`/banners/admin/${id}`, data)
export const deleteBanner = (id) => api.delete(`/banners/admin/${id}`)
export const reorderBanners = (items) => api.post('/banners/admin/reorder', { items })

// Admin settings
export const updateAdminSettings = (data) => api.patch('/settings/admin', data)

// Admin orders (enhanced)
export const refundOrder = (id) => api.post(`/admin/orders/${id}/refund`)

// Admin team / invites
export const createInvite = (data) => api.post('/admin/invite', data)
export const validateInvite = (token) =>
  api.get(`/admin/invite/validate?token=${encodeURIComponent(token)}`)
export const onboardAdmin = ({ token, email, password }) =>
  api.post('/admin/onboard', { token, email, password })
export const getAdmins = () => api.get('/admin/admins')
export const getInvites = () => api.get('/admin/invites')
export const revokeInvite = (id) => api.delete(`/admin/invites/${id}`)

export default api
