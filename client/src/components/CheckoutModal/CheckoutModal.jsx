import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { cancelPayment, createPaymentOrder } from '../../services/api'
import StepCart from './StepCart'
import StepAddress from './StepAddress'
import StepPayment from './StepPayment'
import StepSuccess from './StepSuccess'
import styles from './CheckoutModal.module.css'

const STEPS = [
  { id: 1, name: 'Review' },
  { id: 2, name: 'Address' },
  { id: 3, name: 'Payment' },
  { id: 4, name: 'Confirmation' },
]

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, getTotal, clearCart, removeItem } = useCart()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [orderData, setOrderData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [orderDetails, setOrderDetails] = useState(null)

  if (!isOpen) return null

  const cartItems = cart
  const hasItems = cartItems.length > 0
  const hasUnavailable = cartItems.some(
    (item) => item?.status && item.status.toLowerCase() !== 'available'
  )
  const cartTotal = getTotal()

  const handleNext = () => {
    if (currentStep !== 1) return
    if (!hasItems) {
      showToast('Your cart is empty.', 'error')
      return
    }
    if (hasUnavailable) {
      showToast('One or more items are no longer available.', 'error')
      return
    }
    setCurrentStep(2)
  }

  const handleCancelOrder = async (message) => {
    if (orderData?.orderId && paymentStatus !== 'paid') {
      try {
        await cancelPayment(orderData.orderId)
      } catch (error) {
        console.error('[v0] Cancel order failed:', error)
      }
    }
    if (message) showToast(message, 'info')
    setOrderData(null)
    setPaymentStatus('idle')
  }

  const handleBack = async () => {
    if (currentStep === 3) {
      await handleCancelOrder('Reservation released. Update details to continue.')
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAddressSubmit = async (data) => {
    setFormData(data)
    if (!hasItems) {
      showToast('Your cart is empty.', 'error')
      return
    }
    if (hasUnavailable) {
      showToast('One or more items are no longer available.', 'error')
      return
    }

    setIsCreatingOrder(true)
    try {
      const order = await createPaymentOrder({
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customer: {
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
        },
        address: {
          line1: data.line1.trim(),
          line2: data.line2.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          pincode: data.pincode.trim(),
        },
      })

      setOrderData(order)
      setPaymentStatus('pending')
      setCurrentStep(3)
    } catch (error) {
      const message = error?.message || 'Unable to start checkout'
      if (message.toLowerCase().includes('no longer available')) {
        cartItems.forEach((item) => removeItem(item.productId))
      }
      showToast(message, 'error')
      setCurrentStep(1)
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handlePaymentSuccess = (details) => {
    setOrderDetails({
      ...details,
      items: cartItems,
      totalAmount: orderData?.amount ? orderData.amount / 100 : cartTotal,
    })
    setPaymentStatus('paid')
    setCurrentStep(4)
  }

  const handleClose = () => {
    if (paymentStatus !== 'paid') {
      handleCancelOrder()
    }
    if (currentStep === 4 || paymentStatus === 'paid') {
      clearCart()
    }
    setCurrentStep(1)
    setOrderData(null)
    setOrderDetails(null)
    setPaymentStatus('idle')
    onClose()
  }

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Checkout</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {STEPS.map((step, index) => (
            <div key={step.id}>
              <div
                className={`${styles.stepDot} ${
                  currentStep >= step.id ? styles.active : ''
                }`}
              >
                {currentStep > step.id ? '✓' : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`${styles.stepLine} ${
                    currentStep > step.id ? styles.active : ''
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className={styles.content}>
          {currentStep === 1 && <StepCart cartTotal={cartTotal} />}
          {currentStep === 2 && (
            <StepAddress
              onSubmit={handleAddressSubmit}
              formData={formData}
              isSubmitting={isCreatingOrder}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <StepPayment
              formData={formData}
              cartTotal={cartTotal}
              orderData={orderData}
              onCancel={() => handleCancelOrder('Payment cancelled.')}
              onExpired={() => handleCancelOrder('Reservation expired.')}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                showToast(`Payment error: ${error.message}`, 'error')
              }}
            />
          )}
          {currentStep === 4 && (
            <StepSuccess
              orderDetails={orderDetails}
              formData={formData}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Navigation */}
        {currentStep === 1 && (
          <div className={styles.footer}>
            <button
              className={styles.btnSecondary}
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </button>
            <button className={styles.btnPrimary} onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  )
}
