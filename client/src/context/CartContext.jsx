import { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('[v0] Failed to load cart from localStorage:', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addItem = (product) => {
    const productId = product?._id || product?.id
    const price = Number(
      product?.salePrice ?? product?.price ?? product?.originalPrice ?? 0
    )
    const image =
      product?.thumbnailUrl ||
      product?.image ||
      product?.images?.[0] ||
      '/placeholder-logo.svg'

    if (!productId) return

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === productId)
      if (existingItem) {
        return prevCart
      }
      return [
        ...prevCart,
        {
          productId,
          name: product.name,
          price,
          image,
          status: product.status,
          quantity: 1,
        },
      ]
    })
  }

  const removeItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(1, quantity) }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
