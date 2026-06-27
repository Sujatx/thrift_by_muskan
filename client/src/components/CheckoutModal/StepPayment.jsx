import { useEffect, useMemo, useRef, useState } from 'react'
import { verifyPayment } from '../../services/api'
import { formatPrice } from '../../utils/formatters'
import styles from './StepPayment.module.css'

export default function StepPayment({
  formData,
  cartTotal,
  orderData,
  onSuccess,
  onError,
  onCancel,
  onExpired,
}) {
  const [loading, setLoading] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [errorTitle, setErrorTitle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const expiredRef = useRef(false)

  const reservedUntil = useMemo(() => {
    if (!orderData?.reservedUntil) return null
    const parsed = Date.parse(orderData.reservedUntil)
    return Number.isNaN(parsed) ? null : parsed
  }, [orderData])

  // Countdown timer
  useEffect(() => {
    if (!reservedUntil) return
    const updateTimer = () => {
      const secondsLeft = Math.max(0, Math.floor((reservedUntil - Date.now()) / 1000))
      setTimeLeft(secondsLeft)
      if (secondsLeft === 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpired?.()
      }
    }
    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [reservedUntil, onExpired])

  useEffect(() => {
    setErrorTitle('')
    setErrorMessage('')
    setProcessingMessage('')
  }, [orderData?.orderId])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const loadRazorpay = () => {
    if (window.Razorpay) return Promise.resolve(true)
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePaymentClick = async () => {
    if (!orderData?.razorpayKeyId || !orderData?.razorpayOrderId) {
      const error = new Error('Payment data missing. Please restart checkout.')
      setErrorTitle('Payment unavailable.')
      setErrorMessage('Payment data missing. Please restart checkout.')
      onError(error)
      return
    }

    setErrorTitle('')
    setErrorMessage('')
    setLoading(true)
    setProcessingMessage('Opening payment...')
    try {
      const ok = await loadRazorpay()
      if (!ok) {
        throw new Error('Payment gateway failed to load')
      }

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Thrift by Muskan',
        description: orderData.productName || 'Order',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          orderId: orderData.orderId,
        },
        theme: { color: '#e8527a' },
        modal: {
          ondismiss: () => {
            setLoading(false)
            setProcessingMessage('')
            onCancel?.()
          },
        },
        handler: async (response) => {
          setLoading(true)
          setProcessingMessage('Confirming your payment...')
          try {
            const verified = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: orderData.orderId,
            })

            onSuccess({
              orderId: verified?.orderId || orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
          } catch (error) {
            setErrorTitle('Payment verification failed.')
            setErrorMessage(
              'Payment verification failed. If money was deducted, WhatsApp us immediately.'
            )
            onError(error)
          } finally {
            setLoading(false)
            setProcessingMessage('')
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        const message = response?.error?.description || 'Payment failed'
        setErrorTitle('Payment failed.')
        setErrorMessage(
          'Payment failed. Your item reservation will expire soon.'
        )
        onError(new Error(message))
        setLoading(false)
        setProcessingMessage('')
      })
      rzp.open()
      setLoading(false)
      setProcessingMessage('')
    } catch (error) {
      setErrorTitle('Payment verification failed.')
      setErrorMessage(
        'Payment verification failed. If money was deducted, WhatsApp us immediately.'
      )
      onError(error)
      setLoading(false)
      setProcessingMessage('')
    }
  }

  const total = orderData?.amount
    ? orderData.amount / 100
    : cartTotal || 0
  const isReady = Boolean(orderData?.razorpayKeyId && orderData?.razorpayOrderId)
  const isExpired = reservedUntil ? timeLeft <= 0 : false

  const supportNumber = (import.meta.env.VITE_ADMIN_WHATSAPP || '').replace(/\D/g, '')
  const whatsappLink = supportNumber ? `https://wa.me/${supportNumber}` : ''
  const showError = Boolean(errorMessage)

  const timerTone =
    timeLeft <= 60
      ? styles.timerRed
      : timeLeft <= 180
        ? styles.timerOrange
        : styles.timerGreen

  return (
    <div className={styles.container}>
      <h3 className={styles.stepTitle}>Payment</h3>

      {/* Order Summary */}
      <div className={styles.summary}>
        <h4 className={styles.summaryTitle}>Order Summary</h4>
        <div className={styles.summaryRow}>
          <span>Subtotal:</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total Amount:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className={styles.customerInfo}>
        <h4 className={styles.infoTitle}>Shipping To</h4>
        <p className={styles.infoParagraph}>
          <strong>{formData.name}</strong>
        </p>
        <p className={styles.infoParagraph}>
          {formData.line1}
          {formData.line2 ? `, ${formData.line2}` : ''}
          <br />
          {formData.city}, {formData.state} {formData.pincode}
        </p>
        <p className={styles.infoParagraph}>
          {formData.email}
          <br />
          {formData.phone}
        </p>
      </div>

      {/* Timer */}
      {reservedUntil && (
        <div className={styles.timerBox}>
          <p className={styles.timerText}>
            Your item is reserved for{' '}
            <strong className={`${styles.timer} ${timerTone} ${
              timeLeft <= 60 ? styles.timerPulse : ''
            }`}>
              {formatTime(timeLeft)}
            </strong>{' '}
            ⏳
          </p>
          <p className={styles.timerSubtext}>
            Complete payment before the timer runs out!
          </p>
        </div>
      )}

      {processingMessage && (
        <div className={styles.loadingBox}>{processingMessage}</div>
      )}

      {showError && (
        <div className={styles.errorBox}>
          <p className={styles.errorTitle}>{errorTitle || 'Payment error.'}</p>
          <p className={styles.errorText}>{errorMessage}</p>
          <div className={styles.errorActions}>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className={styles.whatsappBtn}
              >
                WhatsApp Us
              </a>
            ) : (
              <button className={styles.whatsappBtn} disabled>
                WhatsApp Us
              </button>
            )}
            <button
              type="button"
              className={styles.retryBtn}
              onClick={handlePaymentClick}
              disabled={loading || isExpired || !isReady}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePaymentClick}
        disabled={loading || isExpired || !isReady}
        className={styles.paymentBtn}
      >
        {loading && 'Processing...'}
        {!loading && !isExpired && !isReady && 'Preparing payment...'}
        {!loading && !isExpired && isReady && `Pay ${formatPrice(total)} with Razorpay`}
        {isExpired && 'Order Expired'}
      </button>

      {/* Info */}
      <div className={styles.info}>
        <p>Secure payment powered by Razorpay</p>
      </div>
    </div>
  )
}
