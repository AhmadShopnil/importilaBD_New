"use client"

import { useCart } from "@/context/CartContext"
import { X, CheckCircle, User, Phone, MapPin, FileText, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"
import { BASE_URL } from "@/utils/baseUrl"
import { trackBeginCheckout, trackPurchase, trackAddShippingInfo } from "@/utils/gtm"

const CheckoutModal = ({ isOpen, onClose, items, total }) => {
    const { clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [deliveryLocation, setDeliveryLocation] = useState("inside") // "inside" or "outside"
    const [shippingRates, setShippingRates] = useState({ inside: 60, outside: 120 })
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "",
        address: "",
        note: ""
    })

    // Fetch shipping rates from settings
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/settings`)
                if (res.ok) {
                    const data = await res.json()
                    setShippingRates({
                        inside: data.insideDhakaCharge || 60,
                        outside: data.outsideDhakaCharge || 120
                    })
                }
            } catch (err) {
                console.error("Failed to fetch shipping rates", err)
            }
        }
        if (isOpen) fetchRates()
    }, [isOpen])

    useEffect(() => {
        if (isOpen && items?.length > 0) {
            trackBeginCheckout(items, total)
        }
    }, [isOpen, items, total])

    const totalItems = (items || []).reduce((acc, item) => acc + (Number(item.quantity) || 1), 0)
    const calculatedSubtotal = (total !== undefined && !isNaN(Number(total)) && Number(total) > 0)
        ? Number(total)
        : (items || []).reduce((acc, item) => {
            const itemPrice = Number(item.offerPrice > 0 ? item.offerPrice : item.price) || 0
            return acc + (itemPrice * (Number(item.quantity) || 1))
          }, 0)
    const insideCharge = Number(shippingRates?.inside) || 60
    const outsideCharge = Number(shippingRates?.outside) || 120
    const shippingCharge = totalItems >= 3 ? 0 : (deliveryLocation === "inside" ? insideCharge : outsideCharge)
    const finalTotal = calculatedSubtotal + shippingCharge

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Phone validation: exactly 11 digits
        const phoneRegex = /^\d{11}$/;
        if (!phoneRegex.test(customerInfo.phone)) {
            alert("Please enter a valid 11-digit phone number.")
            return
        }

        setLoading(true)

        try {
            trackAddShippingInfo(items, finalTotal, deliveryLocation === "inside" ? "Inside Dhaka" : "Outside Dhaka")

            const orderData = {
                customerName: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address,
                note: customerInfo.note,
                deliveryLocation,
                shippingCharge,
                items: items.map(item => ({
                    productId: item.productId || item.originalId || item._id || item.id,
                    name: item.name,
                    color: item.selectedColor || item.colorName,
                    colorName: item.selectedColor || item.colorName,
                    size: item.selectedSize || item.size,
                    sku: item.sku,
                    image: item.image || item.featuredImage,
                    price: item.offerPrice || item.price,
                    quantity: item.quantity
                })),
                totalPrice: calculatedSubtotal,
                totalAmount: finalTotal,
                productType: "regular",
                status: "pending"
            }

            const response = await fetch(`${BASE_URL}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            })

            if (response.ok) {
                const data = await response.json()
                trackPurchase(data.orderId || data.result?.insertedId || 'order_' + Date.now(), finalTotal, items)
                alert("Order placed successfully! We will contact you shortly.")
                clearCart()
                onClose()
                window.location.href = "/thank-you"
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || "Failed to place order"}`)
            }
        } catch (error) {
            console.error("Order submission error:", error)
            alert("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-xl border border-gray-200 shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Order Summary (Desktop sidebar) */}
                    <div className="w-full md:w-[250px] bg-gray-50/80 p-5 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto hidden md:block">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C546D] mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Order Summary
                        </h3>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-2.5">
                                    <img
                                        src={item?.image || item.featuredImage || "/placeholder.svg"}
                                        className="w-10 h-10 rounded-md object-cover bg-white border border-gray-200 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">
                                            {item.selectedSize ? `${item.selectedSize} • ` : ""}{item.quantity} × ৳{item.offerPrice || item.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>৳{calculatedSubtotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 font-medium">
                                <span>Delivery Charge</span>
                                <span className={shippingCharge === 0 ? "text-emerald-700 font-bold" : ""}>
                                    {shippingCharge === 0 ? "FREE" : `৳${shippingCharge}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200/80 font-bold text-gray-900">
                                <span>Total</span>
                                <span className="text-base text-[#1C546D]">৳{finalTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 p-5 sm:p-7 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Information</h2>
                                <p className="text-xs text-gray-500">Fill in your information to complete your order</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Location Selection */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryLocation("inside")}
                                    className={`py-2.5 px-3 rounded-md border text-center transition-all ${
                                        deliveryLocation === "inside"
                                            ? "border-[#1C546D] bg-[#1C546D]/5 text-[#1C546D] font-semibold"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    <p className="text-xs font-bold">Inside Dhaka</p>
                                    <p className="text-[11px] opacity-80">৳{insideCharge}</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryLocation("outside")}
                                    className={`py-2.5 px-3 rounded-md border text-center transition-all ${
                                        deliveryLocation === "outside"
                                            ? "border-[#1C546D] bg-[#1C546D]/5 text-[#1C546D] font-semibold"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    <p className="text-xs font-bold">Outside Dhaka</p>
                                    <p className="text-[11px] opacity-80">৳{outsideCharge}</p>
                                </button>
                            </div>

                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    required
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-gray-200 bg-white focus:ring-1 focus:ring-[#1C546D] focus:border-[#1C546D] outline-none text-xs sm:text-sm font-medium"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    placeholder="11-Digit Phone Number *"
                                    required
                                    minLength={11}
                                    maxLength={11}
                                    pattern="\d{11}"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/\D/g, '') })}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-gray-200 bg-white focus:ring-1 focus:ring-[#1C546D] focus:border-[#1C546D] outline-none text-xs sm:text-sm font-medium"
                                />
                            </div>

                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <textarea
                                    placeholder="Full Delivery Address (House, Road, Area, Thana, District) *"
                                    required
                                    rows={2}
                                    value={customerInfo.address}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-gray-200 bg-white focus:ring-1 focus:ring-[#1C546D] focus:border-[#1C546D] outline-none text-xs sm:text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <textarea
                                    placeholder="Additional Order Notes (Optional)"
                                    rows={1}
                                    value={customerInfo.note}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 bg-white focus:ring-1 focus:ring-[#1C546D] focus:border-[#1C546D] outline-none text-xs sm:text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-[#1C546D] hover:bg-[#164458] text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        "Processing..."
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Confirm Order - ৳{finalTotal}</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center text-gray-500 mt-2">
                                    {totalItems >= 3 ? "Free shipping applied for 3+ items!" : "Cash on delivery available nationwide."}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutModal
