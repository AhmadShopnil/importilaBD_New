"use client"

import { useEffect, useState } from "react"
import { Save, Store, Mail, Phone, MapPin, DollarSign, Image as ImageIcon, Truck, Upload, Layout, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { BASE_URL } from "@/utils/baseUrl"
import Loading from "@/components/Loader/Loading"
import RichTextEditor from "@/components/RichTextEditor"
import { FileText } from "lucide-react"
import MediaPicker from "@/components/Dashboard/MediaManager/MediaPicker"

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState({
        storeName: "",
        storeEmail: "",
        storePhone: "",
        storeAddress: "",
        storeCity: "",
        storeCountry: "",
        storeZipCode: "",
        currency: "BDT",
        currencySymbol: "৳",
        storeLogo: "",
        storeFavicon: "",
        storeDisplayMode: "logo_only",
        dashboardName: "",
        dashboardLogo: "",
        dashboardDisplayMode: "logo_only",
        timezone: "Asia/Dhaka",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12h",
        insideDhakaCharge: 60,
        outsideDhakaCharge: 120,
        lowStockThreshold: 10,
        termsAndConditions: ""
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingField, setUploadingField] = useState(null)
    const [mediaPickerTarget, setMediaPickerTarget] = useState(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings`, {
                credentials: "include"
            })
            const data = await res.json()
            if (res.ok) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    storeDisplayMode: data.storeDisplayMode || "logo_only",
                    dashboardDisplayMode: data.dashboardDisplayMode || "logo_only",
                    dashboardName: data.dashboardName || "Admin Panel",
                    dashboardLogo: data.dashboardLogo || data.storeLogo || "/logo.svg"
                }))
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error)
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (file, fieldKey) => {
        if (!file) return
        try {
            setUploadingField(fieldKey)
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", "branding")
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                credentials: "include"
            })
            const data = await res.json()
            if (res.ok && data.url) {
                setSettings(prev => ({ ...prev, [fieldKey]: data.url }))
                toast.success("Image uploaded successfully")
            } else {
                toast.error(data.error || "Failed to upload image")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Upload failed")
        } finally {
            setUploadingField(null)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch(`/api/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
                credentials: "include"
            })

            if (res.ok) {
                toast.success("Settings saved successfully!")
            } else {
                const errorData = await res.json().catch(() => ({}))
                toast.error(errorData.error || "Failed to save settings")
            }
        } catch (error) {
            console.error("Failed to save settings:", error)
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading />

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Store Information */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Store className="w-5 h-5 text-[#1E556E]" />
                    <h2 className="text-xl font-semibold">Store Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Store Name *</label>
                        <input
                            type="text"
                            required
                            value={settings.storeName}
                            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="Kids Shop"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Store Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={settings.storeEmail}
                            onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="contact@kidsshop.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Store Phone *
                        </label>
                        <input
                            type="tel"
                            required
                            value={settings.storePhone}
                            onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="+880 1XXXXXXXXX"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Street Address
                        </label>
                        <input
                            type="text"
                            value={settings.storeAddress}
                            onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="123 Main Street"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">City</label>
                        <input
                            type="text"
                            value={settings.storeCity}
                            onChange={(e) => setSettings({ ...settings, storeCity: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="Dhaka"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Zip Code</label>
                        <input
                            type="text"
                            value={settings.storeZipCode}
                            onChange={(e) => setSettings({ ...settings, storeZipCode: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="1200"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Country</label>
                        <input
                            type="text"
                            value={settings.storeCountry}
                            onChange={(e) => setSettings({ ...settings, storeCountry: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="Bangladesh"
                        />
                    </div>
                </div>
            </div>

            {/* Currency Settings */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="w-5 h-5 text-[#1E556E]" />
                    <h2 className="text-xl font-semibold">Currency & Localization</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Currency Code</label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                        >
                            <option value="BDT">BDT - Bangladeshi Taka</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="INR">INR - Indian Rupee</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Currency Symbol</label>
                        <input
                            type="text"
                            value={settings.currencySymbol}
                            onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="৳"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Timezone</label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                        >
                            <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Date Format</label>
                        <select
                            value={settings.dateFormat}
                            onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Time Format</label>
                        <select
                            value={settings.timeFormat}
                            onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                        >
                            <option value="12h">12 Hour (AM/PM)</option>
                            <option value="24h">24 Hour</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Shipping Settings */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Truck className="w-5 h-5 text-[#1E556E]" />
                    <h2 className="text-xl font-semibold">Shipping Charges</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Inside Dhaka Charge (৳)</label>
                        <input
                            type="number"
                            value={settings.insideDhakaCharge}
                            onChange={(e) => setSettings({ ...settings, insideDhakaCharge: Number(e.target.value) })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="60"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Outside Dhaka Charge (৳)</label>
                        <input
                            type="number"
                            value={settings.outsideDhakaCharge}
                            onChange={(e) => setSettings({ ...settings, outsideDhakaCharge: Number(e.target.value) })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="120"
                        />
                    </div>
                </div>
            </div>

            {/* Inventory Settings */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Store className="w-5 h-5 text-[#1E556E]" />
                    <h2 className="text-xl font-semibold">Inventory Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Low Stock Alert Threshold</label>
                        <input
                            type="number"
                            min="0"
                            value={settings.lowStockThreshold}
                            onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Products with stock under this amount will trigger a low stock alert.</p>
                    </div>
                </div>
            </div>

            {/* Frontend Storefront Branding */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-[#1E556E]" />
                        <div>
                            <h2 className="text-xl font-semibold">Storefront Branding</h2>
                            <p className="text-xs text-muted-foreground">Manage how your brand appears on the public storefront</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Storefront Name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Storefront Brand Name *</label>
                        <input
                            type="text"
                            required
                            value={settings.storeName}
                            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="e.g. Importila"
                        />
                    </div>

                    {/* Storefront Logo Upload & Preview */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Storefront Logo</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="border border-border rounded-lg p-4 bg-muted/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-28 h-16 bg-white border border-border rounded-md flex items-center justify-center p-2 overflow-hidden shadow-sm">
                                        {settings.storeLogo ? (
                                            <img
                                                src={settings.storeLogo}
                                                alt="Storefront Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground text-center">No logo</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            <label className="cursor-pointer bg-[#1E556E] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>{uploadingField === "storeLogo" ? "Uploading..." : "Upload New"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={uploadingField === "storeLogo"}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleFileUpload(file, "storeLogo")
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setMediaPickerTarget("storeLogo")}
                                                className="bg-white border border-[#1E556E] text-[#1E556E] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#1E556E]/5 transition-colors"
                                            >
                                                Media Library
                                            </button>
                                            {settings.storeLogo && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({ ...prev, storeLogo: "" }))}
                                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1.5"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">Recommended: Transparent PNG or SVG (approx. 160×45px)</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        value={settings.storeLogo || ""}
                                        onChange={(e) => setSettings({ ...settings, storeLogo: e.target.value })}
                                        className="w-full px-3 py-1.5 text-xs border border-border rounded-md bg-white text-muted-foreground"
                                        placeholder="Or paste Logo Image URL (e.g. /logo.svg or https://...)"
                                    />
                                </div>
                            </div>

                            {/* Storefront Display Mode */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold">Storefront Header Display Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "logo_only", label: "Logo Only", desc: "Display logo image" },
                                        { id: "name_only", label: "Name Only", desc: "Display store name" },
                                        { id: "both", label: "Logo + Name", desc: "Display both together" }
                                    ].map((mode) => (
                                        <label
                                            key={mode.id}
                                            onClick={() => setSettings({ ...settings, storeDisplayMode: mode.id })}
                                            className={`cursor-pointer p-3 border rounded-lg flex flex-col justify-between transition-all ${
                                                settings.storeDisplayMode === mode.id
                                                    ? "border-[#1E556E] bg-[#1E556E]/5 ring-1 ring-[#1E556E]"
                                                    : "border-border hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-foreground">{mode.label}</span>
                                                <input
                                                    type="radio"
                                                    name="storeDisplayMode"
                                                    value={mode.id}
                                                    checked={settings.storeDisplayMode === mode.id}
                                                    onChange={() => setSettings({ ...settings, storeDisplayMode: mode.id })}
                                                    className="accent-[#1E556E]"
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">{mode.desc}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Live Preview Box */}
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Storefront Live Preview</span>
                                    <div className="h-14 bg-white border border-slate-200 rounded px-4 flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-2.5">
                                            {(settings.storeDisplayMode === "logo_only" || settings.storeDisplayMode === "both" || !settings.storeDisplayMode) && (
                                                settings.storeLogo ? (
                                                    <img src={settings.storeLogo} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">[No Logo URL]</span>
                                                )
                                            )}
                                            {(settings.storeDisplayMode === "name_only" || settings.storeDisplayMode === "both") && (
                                                <span className="text-base font-bold text-[#1C546D] tracking-tight">
                                                    {settings.storeName || "Store Name"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>Home</span>
                                            <span>Shop</span>
                                            <span>Combos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Favicon */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Store Favicon URL</label>
                        <div className="flex items-center gap-3">
                            {settings.storeFavicon && (
                                <img src={settings.storeFavicon} alt="Favicon" className="w-8 h-8 rounded border border-border p-1 object-contain" />
                            )}
                            <input
                                type="url"
                                value={settings.storeFavicon || ""}
                                onChange={(e) => setSettings({ ...settings, storeFavicon: e.target.value })}
                                className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none text-sm"
                                placeholder="https://example.com/favicon.ico"
                            />
                            <button
                                type="button"
                                onClick={() => setMediaPickerTarget("storeFavicon")}
                                className="bg-white border border-border text-foreground px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-muted"
                            >
                                Browse
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 32×32px PNG or ICO</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Branding */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-[#1E556E]" />
                        <div>
                            <h2 className="text-xl font-semibold">Dashboard Branding</h2>
                            <p className="text-xs text-muted-foreground">Manage branding displayed in the Admin Dashboard sidebar & header</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Dashboard Name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Dashboard Brand Name</label>
                        <input
                            type="text"
                            value={settings.dashboardName || ""}
                            onChange={(e) => setSettings({ ...settings, dashboardName: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#1E556E] outline-none"
                            placeholder="e.g. Admin Panel or Importila Admin"
                        />
                    </div>

                    {/* Dashboard Logo Upload & Preview */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Dashboard Logo</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="border border-border rounded-lg p-4 bg-muted/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-28 h-16 bg-white border border-border rounded-md flex items-center justify-center p-2 overflow-hidden shadow-sm">
                                        {settings.dashboardLogo ? (
                                            <img
                                                src={settings.dashboardLogo}
                                                alt="Dashboard Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground text-center">No logo</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            <label className="cursor-pointer bg-[#1E556E] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>{uploadingField === "dashboardLogo" ? "Uploading..." : "Upload New"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={uploadingField === "dashboardLogo"}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleFileUpload(file, "dashboardLogo")
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setMediaPickerTarget("dashboardLogo")}
                                                className="bg-white border border-[#1E556E] text-[#1E556E] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#1E556E]/5 transition-colors"
                                            >
                                                Media Library
                                            </button>
                                            {settings.dashboardLogo && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({ ...prev, dashboardLogo: "" }))}
                                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1.5"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">Logo for admin sidebar and mobile admin header</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        value={settings.dashboardLogo || ""}
                                        onChange={(e) => setSettings({ ...settings, dashboardLogo: e.target.value })}
                                        className="w-full px-3 py-1.5 text-xs border border-border rounded-md bg-white text-muted-foreground"
                                        placeholder="Or paste Logo Image URL (e.g. /logo.svg or https://...)"
                                    />
                                </div>
                            </div>

                            {/* Dashboard Display Mode */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold">Dashboard Display Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "logo_only", label: "Logo Only", desc: "Display logo image" },
                                        { id: "name_only", label: "Name Only", desc: "Display admin name" },
                                        { id: "both", label: "Logo + Name", desc: "Display both together" }
                                    ].map((mode) => (
                                        <label
                                            key={mode.id}
                                            onClick={() => setSettings({ ...settings, dashboardDisplayMode: mode.id })}
                                            className={`cursor-pointer p-3 border rounded-lg flex flex-col justify-between transition-all ${
                                                settings.dashboardDisplayMode === mode.id
                                                    ? "border-[#1E556E] bg-[#1E556E]/5 ring-1 ring-[#1E556E]"
                                                    : "border-border hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-foreground">{mode.label}</span>
                                                <input
                                                    type="radio"
                                                    name="dashboardDisplayMode"
                                                    value={mode.id}
                                                    checked={settings.dashboardDisplayMode === mode.id}
                                                    onChange={() => setSettings({ ...settings, dashboardDisplayMode: mode.id })}
                                                    className="accent-[#1E556E]"
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">{mode.desc}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Live Dashboard Preview */}
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Dashboard Sidebar Preview</span>
                                    <div className="h-16 bg-white border border-slate-200 rounded px-4 flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            {(settings.dashboardDisplayMode === "logo_only" || settings.dashboardDisplayMode === "both" || !settings.dashboardDisplayMode) && (
                                                settings.dashboardLogo ? (
                                                    <img src={settings.dashboardLogo} alt="Logo" className="h-7 max-w-[120px] object-contain shrink-0" />
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">[No Logo]</span>
                                                )
                                            )}
                                            {(settings.dashboardDisplayMode === "name_only" || settings.dashboardDisplayMode === "both") && (
                                                <span className="text-sm font-bold text-primary truncate">
                                                    {settings.dashboardName || "Admin Panel"}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">◀</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-[#1E556E]" />
                    <h2 className="text-xl font-semibold">Legal & Policies</h2>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-semibold text-foreground flex justify-between items-center">
                        <span>Terms and Conditions</span>
                        <span className="text-[10px] text-primary bg-primary/5 px-2 py-1 rounded">Rich Text Editor</span>
                    </label>
                    <RichTextEditor
                        value={settings.termsAndConditions}
                        onChange={(content) => setSettings(prev => ({ ...prev, termsAndConditions: content }))}
                        placeholder="Write your store's terms and conditions here..."
                    />
                </div>
            </div>


            <div className="sticky bottom-4 z-10">
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#1E556E] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-[#1E556E]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : "Save General Settings"}
                </button>
            </div>

            {mediaPickerTarget && (
                <MediaPicker
                    isOpen={Boolean(mediaPickerTarget)}
                    onClose={() => setMediaPickerTarget(null)}
                    onSelect={(media) => {
                        const url = typeof media === "string" ? media : media?.url
                        if (url && mediaPickerTarget) {
                            setSettings(prev => ({ ...prev, [mediaPickerTarget]: url }))
                        }
                        setMediaPickerTarget(null)
                    }}
                    folder="branding"
                />
            )}
        </form>
    )
}
