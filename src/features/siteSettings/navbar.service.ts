import { api as apiClient } from "@/integrations/api/client";
import { defaultNavbarConfig } from "./navbar.defaults";
import { safeParseNavbarConfig } from "./navbar.schema";
import { NavbarConfig } from "./navbar.types";

const NAVBAR_CONFIG_KEY = "navbar_config";

type SiteSettingRow = {
  id: string;
  setting_key: string;
  setting_value: string | null;
};

function mergeWithDefaults(config: NavbarConfig): NavbarConfig {
  const byId = new Map(config.items.map((item) => [item.id, item]));
  const mergedItems = defaultNavbarConfig.items.map((defaultItem) => {
    const existing = byId.get(defaultItem.id);
    return existing ? { ...defaultItem, ...existing } : defaultItem;
  });

  // Keep custom admin-created items too.
  const customItems = config.items.filter(
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

export async function saveNavbarConfig(config: NavbarConfig): Promise<{ error: string | null }> {
  const value = JSON.stringify(config);
  const { data, error: selectError } = await apiClient
    .from<SiteSettingRow>("site_settings")
    .select("*")
    .eq("setting_key", NAVBAR_CONFIG_KEY)
    .maybeSingle();

  if (selectError) {
    return { error: selectError.message };
  }

  if (data?.id) {
    const { error } = await apiClient
      .from("site_settings")
      .update({ setting_value: value, setting_type: "json", description: "Navbar menu, inquiry and badge config" })
      .eq("id", data.id);
    return { error: error?.message ?? null };
  }

  const { error } = await apiClient.from("site_settings").insert([
    {
      setting_key: NAVBAR_CONFIG_KEY,
      setting_value: value,
      setting_type: "json",
      description: "Navbar menu, inquiry and badge config",
      is_public: true,
    },
  ]);

  return { error: error?.message ?? null };
}
