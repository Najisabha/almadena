import { api as apiClient } from "@/integrations/api/client";
import { defaultNavbarConfig } from "./navbar.defaults";
import { safeParseNavbarConfig } from "./navbar.schema";
import { NavbarConfig } from "./navbar.types";

const NAVBAR_CONFIG_KEY = "navbar_config";

/** عناصر قديمة أُزيلت من الإعدادات الافتراضية (مثل تكرار نفس الرابط) */
const DEPRECATED_NAVBAR_ITEM_IDS = new Set(["student-lookup-practical"]);

type SiteSettingRow = {
  id: string;
  setting_key: string;
  setting_value: string | null;
};

function mergeWithDefaults(config: NavbarConfig): NavbarConfig {
  const prunedItems = config.items.filter((item) => !DEPRECATED_NAVBAR_ITEM_IDS.has(item.id));
  const byId = new Map(prunedItems.map((item) => [item.id, item]));
  const mergedItems = defaultNavbarConfig.items.map((defaultItem) => {
    const existing = byId.get(defaultItem.id);
    return existing ? { ...defaultItem, ...existing } : defaultItem;
  });

  // Keep custom admin-created items too.
  const customItems = prunedItems.filter(
    (item) => !defaultNavbarConfig.items.some((defaultItem) => defaultItem.id === item.id)
  );

  return {
    items: [...mergedItems, ...customItems],
    badge: { ...defaultNavbarConfig.badge, ...config.badge },
  };
}

export async function loadNavbarConfig(): Promise<{ config: NavbarConfig; warning?: string }> {
  const { data, error } = await apiClient
    .from<SiteSettingRow>("site_settings")
    .select("*")
    .eq("setting_key", NAVBAR_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    return { config: defaultNavbarConfig, warning: error.message };
  }

  if (!data?.setting_value) {
    return { config: defaultNavbarConfig };
  }

  try {
    const parsedJson = JSON.parse(data.setting_value) as unknown;
    const validated = safeParseNavbarConfig(parsedJson);
    if (!validated) {
      return { config: defaultNavbarConfig, warning: "Invalid stored navbar config. Defaults applied." };
    }
    return { config: mergeWithDefaults(validated) };
  } catch {
    return { config: defaultNavbarConfig, warning: "Corrupted navbar config JSON. Defaults applied." };
  }
}
