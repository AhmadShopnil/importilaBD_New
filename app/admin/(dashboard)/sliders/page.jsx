
import SlidersClient from "@/components/Dashboard/Sliders/SlidersClient"
import { BASE_URL } from "@/utils/baseUrl"

export const dynamic = "force-dynamic"

async function getSliders() {
    try {
        const res = await fetch(`${BASE_URL}/api/sliders`, {
            cache: "no-store",
        })

        if (!res.ok) {
            return []
        }

        return await res.json()
    } catch (error) {
        console.error("Failed to fetch sliders:", error)
        return []
    }
}

export default async function SlidersPage() {
    const sliders = await getSliders()

    return <SlidersClient initialSliders={sliders} />
}
