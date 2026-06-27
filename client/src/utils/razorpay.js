export const initiatePayment = (orderDetails) => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded'))
      return
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test_key',
      amount: orderDetails.amount * 100, // Convert to paise
      currency: 'INR',
      order_id: orderDetails.razorpayOrderId,
      name: 'Thrift by Muskan',
      description: 'Sustainable Fashion Purchase',
      image: '/placeholder-logo.svg',
      handler: (response) => {
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        })
      },
      prefill: {
        name: orderDetails.customerName || '',
        email: orderDetails.customerEmail || '',
        contact: orderDetails.customerPhone || '',
      },
      theme: {
        color: '#e8527a',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'))
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  })
}
