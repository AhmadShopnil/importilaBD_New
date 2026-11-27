import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAdminAuth } from '@/lib/auth';

export async function GET(req) {
    const admin = await getAdminAuth();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';

    try {
        const { db } = await connectToDatabase();

        // 1. Always aggregate local Courier Performance from DB
        const courierOrders = await db.collection("orders").find({
            $or: [
                { "courier.trackingCode": { $exists: true, $ne: "" } },
                { status: { $in: ["shipped", "delivered", "returned"] } }
            ]
        }).sort({ createdAt: -1 }).toArray();

        let totalDispatched = courierOrders.length;
        let deliveredCount = 0;
        let inTransitCount = 0;
        let returnedCount = 0;
        let totalCodCollected = 0;

        courierOrders.forEach(o => {
            const s = String(o.status || "").toLowerCase();
            if (s === "delivered" || s === "complete" || s === "completed") {
                deliveredCount++;
                totalCodCollected += Number(o.totalAmount || o.totalPrice || 0);
            } else if (s === "shipped" || s === "in_review" || s === "in-transit") {
                inTransitCount++;
            } else if (s === "returned" || s === "rto") {
                returnedCount++;
            }
        });

        const deliveryRate = (deliveredCount + returnedCount) > 0
            ? Number(((deliveredCount / (deliveredCount + returnedCount)) * 100).toFixed(1))
            : (totalDispatched > 0 ? Number(((deliveredCount / totalDispatched) * 100).toFixed(1)) : 0);

        const localCourierStats = {
            totalDispatched,
            deliveredCount,
            inTransitCount,
            returnedCount,
            deliveryRate,
            totalCodCollected,
            recentShipments: courierOrders.slice(0, 15).map(o => ({
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                phone: o.phone,
                city: o.city || o.district || "Dhaka",
                trackingCode: o.courier?.trackingCode || "N/A",
                provider: o.courier?.provider || "Steadfast",
                amount: o.totalAmount || o.totalPrice || 0,
                status: o.status,
                createdAt: o.createdAt
            }))
        };

        if (type === 'summary') {
            return NextResponse.json({ localCourierStats });
        }

        // 2. Query Steadfast Remote API if configured
        const settings = await db.collection('settings').findOne({ type: 'courier' });
        const provider = settings?.providers?.find(p => p.isActive && (p.name.includes("Steadfast") || p.baseUrl?.includes("packzy")));

        if (!provider || !provider.apiKey || !provider.secretKey) {
            return NextResponse.json({
                notConfigured: true,
                message: 'Steadfast API credentials not configured',
                current_balance: 0,
                data: [],
                localCourierStats
            });
        }

        const BASE_URL = provider.baseUrl || 'https://portal.packzy.com/api/v1';
        const headers = {
            'Api-Key': provider.apiKey,
            'Secret-Key': provider.secretKey,
            'Content-Type': 'application/json'
        };

        let result = {};
        let endpoint = '';

        switch (type) {
            case 'balance':
                endpoint = '/get_balance';
                break;
            case 'payments':
                endpoint = '/payments';
                break;
            case 'returns':
                endpoint = '/get_return_requests';
                break;
            default:
                endpoint = '/get_balance';
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers
        });

        const text = await response.text();
        try {
            result = JSON.parse(text);
        } catch (e) {
            result = { error: "Failed to parse API response", raw: text };
        }

        return NextResponse.json({
            ...result,
            localCourierStats
        });

    } catch (error) {
        console.error('Steadfast Report API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
