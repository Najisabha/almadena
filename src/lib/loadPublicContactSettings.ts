import { api as apiClient } from '@/integrations/api/client';

const CONTACT_SETTING_KEYS = [
  'site_phone',
  'site_email',
  'site_address',
  'whatsapp_number',
  'facebook_url',
  'instagram_url',
] as const;

export type PublicContactSettings = Record<(typeof CONTACT_SETTING_KEYS)[number], string>;

export async function loadPublicContactSettings(): Promise<Partial<PublicContactSettings>> {
  const { data, error } = await apiClient
    .from('site_settings')
    .select('setting_key,setting_value')
    .in(
      'setting_key',
      [...CONTACT_SETTING_KEYS]
    );

  if (error || !Array.isArray(data)) {
    return {};
  }

  const out: Partial<PublicContactSettings> = {};
  for (const row of data as { setting_key: string; setting_value: string | null }[]) {
    const v = row.setting_value?.trim();
    if (v) {
      (out as Record<string, string>)[row.setting_key] = v;
    }
  }
  return out;
}
