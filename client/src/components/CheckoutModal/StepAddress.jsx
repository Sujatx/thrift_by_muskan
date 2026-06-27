import { useState } from 'react'
import styles from './StepAddress.module.css'

export default function StepAddress({
  onSubmit,
  formData: initialData,
  isSubmitting,
  onBack,
}) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(formData.phone.trim()))
      newErrors.phone = 'Enter a 10-digit phone number'
    if (!formData.line1.trim()) newErrors.line1 = 'Address line 1 is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(formData.pincode.trim()))
      newErrors.pincode = 'Enter a 6-digit pincode'
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.stepTitle}>Shipping Address</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`${styles.input} ${errors.name ? styles.error : ''}`}
            placeholder="Your full name"
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`${styles.input} ${errors.email ? styles.error : ''}`}
            placeholder="your@email.com"
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        {/* Phone */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`${styles.input} ${errors.phone ? styles.error : ''}`}
            placeholder="10-digit number"
          />
          {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
        </div>

        {/* Address */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Address Line 1</label>
          <input
            type="text"
            name="line1"
            value={formData.line1}
            onChange={handleChange}
            className={`${styles.input} ${errors.line1 ? styles.error : ''}`}
            placeholder="House/Flat No., Street"
          />
          {errors.line1 && <span className={styles.errorText}>{errors.line1}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address Line 2 (optional)</label>
          <input
            type="text"
            name="line2"
            value={formData.line2}
            onChange={handleChange}
            className={styles.input}
            placeholder="Colony, Landmark"
          />
        </div>

        {/* City, State, Pincode */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`${styles.input} ${errors.city ? styles.error : ''}`}
              placeholder="Delhi"
            />
            {errors.city && <span className={styles.errorText}>{errors.city}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`${styles.input} ${errors.state ? styles.error : ''}`}
              placeholder="Delhi"
            />
            {errors.state && <span className={styles.errorText}>{errors.state}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className={`${styles.input} ${errors.pincode ? styles.error : ''}`}
              placeholder="110001"
            />
            {errors.pincode && <span className={styles.errorText}>{errors.pincode}</span>}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onBack}
          >
            Back
          </button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Reserving item...' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}
