import { notFound } from "next/navigation"
import ComboLandingPage from "@/components/landing/ComboLandingPage"
import { getComboBySlug } from "@/lib/dataService"
import { getSliders } from "@/utils/apiActions"

export async function generateMetadata({ params }) {
  const { slug } = await params
  const combo = await getComboBySlug(slug)

  if (!combo) {
    return {
      title: "Combo Not Found",
    }
  }

  return {
    title: `${combo.title} | Importila` || "Importila-Combo",
    description: combo?.shortDescription || combo.description || combo?.landingPageTitle || combo.title,
    openGraph: {
      title: combo.title,
      description: combo?.shortDescription || combo?.description || combo?.title,
      images: [
        {
          url: combo?.featuredImage || combo?.image,
          width: 800,
          height: 600,
          alt: combo?.title,
        },
      ],
    },
  }
}

export default async function Page({ params }) {
  const { slug } = await params;
  const combo = await getComboBySlug(slug)

  if (!combo) {
    notFound()
  }

  // Fetch slider configured for this combo, or fallback to combo_hero_slider
  let comboSliders = [];
  const sliderLocation = combo.sliderLocation || "combo_hero_slider";
  if (sliderLocation) {
    try {
      comboSliders = (await getSliders(sliderLocation)) || [];
    } catch (e) {
      comboSliders = [];
    }
  }

  return <ComboLandingPage
    combo={combo}
    comboSliders={comboSliders}
  />
}
