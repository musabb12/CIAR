import type { FittingGarment } from "@/lib/virtual-fitting/types"
import {
  FITTING_ROOM_CONFIG_KEY,
  type FittingRoomConfig,
  type FittingRoomGarmentItem,
  fittingRoomConfigSchema,
  parseFittingRoomConfig,
  serializeFittingRoomConfig,
} from "@/lib/fitting-room-config"
import { getDefaultFashionDemoAds } from "@/lib/default-site-ads"
import { collectFashionGarmentsFromAds } from "@/lib/virtual-fitting/types"
import { listAllPublicAds } from "@/services/site-ads.service"
import { getSettings, updateSettings } from "@/services/settings.service"

function garmentItemToFittingGarment(item: FittingRoomGarmentItem, locale?: string): FittingGarment {
  const isAr = locale === "ar"
  return {
    id: item.id,
    title: isAr ? item.titleAr : item.titleEn,
    imageUrl: item.imageUrl,
    brand: item.brand,
    price: item.price,
    currency: item.currency,
    sizes: item.sizes,
    colors: item.colors,
    fabricTypes: item.fabricTypes,
  }
}

export async function getFittingRoomConfig(): Promise<FittingRoomConfig> {
  const settings = await getSettings()
  return parseFittingRoomConfig(settings[FITTING_ROOM_CONFIG_KEY])
}

export async function saveFittingRoomConfig(config: FittingRoomConfig): Promise<FittingRoomConfig> {
  const parsed = fittingRoomConfigSchema.parse(config)
  await updateSettings({ [FITTING_ROOM_CONFIG_KEY]: serializeFittingRoomConfig(parsed) })
  return parseFittingRoomConfig(serializeFittingRoomConfig(parsed))
}

export async function resolvePublicFittingGarments(locale?: string): Promise<{
  config: FittingRoomConfig
  garments: FittingGarment[]
}> {
  const config = await getFittingRoomConfig()
  if (!config.enabled) {
    return { config, garments: [] }
  }

  const byId = new Map<string, FittingGarment>()

  const adminGarments = [...config.garments]
    .filter((g) => g.enabled && g.imageUrl.trim())
    .sort((a, b) => a.order - b.order)
    .map((g) => garmentItemToFittingGarment(g, locale))

  for (const garment of adminGarments) byId.set(garment.id, garment)

  if (config.useFashionAds) {
    try {
      const ads = await listAllPublicAds(locale)
      const merged = collectFashionGarmentsFromAds(ads)
      for (const garment of merged) {
        if (!byId.has(garment.id)) byId.set(garment.id, garment)
      }
    } catch {
      const demos = collectFashionGarmentsFromAds(getDefaultFashionDemoAds(locale))
      for (const garment of demos) {
        if (!byId.has(garment.id)) byId.set(garment.id, garment)
      }
    }
  }

  return { config, garments: [...byId.values()] }
}
