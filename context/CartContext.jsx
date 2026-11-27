"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { trackAddToCart, trackRemoveFromCart } from '@/utils/gtm'

const CartContext = createContext()

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        return {
            cartItems: [],
            cartCount: 0,
            addToCart: () => {},
            removeFromCart: () => {},
            updateQuantity: () => {},
            clearCart: () => {},
            isCartOpen: false,
            setIsCartOpen: () => {},
            cartTotal: 0,
        }
    }
    return context
}

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('importila_cart')
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart from storage", e)
            }
        }
    }, [])

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('importila_cart', JSON.stringify(cartItems))
    }, [cartItems])

    const addToCart = (product, variant, quantity = 1) => {
        setCartItems(prev => {
            const realProductId = product.originalId || product._id
            const existingItemIndex = prev.findIndex(item =>
                (item.originalId || item.productId || item._id) === realProductId &&
                ((variant.sku && item.sku === variant.sku) ||
                 (item.selectedColor === (variant.colorName || variant.color) && item.selectedSize === variant.size))
            )

            if (existingItemIndex > -1) {
                return prev.map((item, idx) => {
                    if (idx === existingItemIndex) {
                        return {
                            ...item,
                            quantity: (Number(item.quantity) || 1) + (Number(quantity) || 1)
                        }
                    }
                    return item
                })
            }

            return [...prev, {
                ...product,
                _id: realProductId,
                productId: realProductId,
                selectedColor: variant.colorName || variant.color,
                colorName: variant.colorName || variant.color,
                selectedColorHex: variant.colorHex,
                selectedSize: variant.size,
                size: variant.size,
                sku: variant.sku,
                image: variant?.image || product?.featuredImage || product?.image,
                quantity: Number(quantity) || 1
            }]
        })
        trackAddToCart(product, variant, quantity)
        setIsCartOpen(true)
    }

    const removeFromCart = (index) => {
        setCartItems(prev => {
            const itemToRemove = prev[index];
            if (itemToRemove) {
                trackRemoveFromCart(itemToRemove, { sku: itemToRemove.sku }, itemToRemove.quantity);
            }
            return prev.filter((_, i) => i !== index);
        })
    }

    const updateQuantity = (index, delta) => {
        setCartItems(prev => {
            return prev.map((item, idx) => {
                if (idx === index) {
                    const currentQty = Number(item.quantity) || 1
                    return {
                        ...item,
                        quantity: Math.max(1, currentQty + delta)
                    }
                }
                return item
            })
        })
    }

    const clearCart = () => {
        setCartItems([])
    }

    const cartTotal = cartItems.reduce((total, item) =>
        total + (item.offerPrice || item.price) * item.quantity, 0
    )

    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0)

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    )
}
