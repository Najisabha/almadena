const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";
const TOKEN_KEY = "almadena_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  withAuth = false
): Promise<{ data: T | null; error: string | null }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> || {}),
    };
    if (withAuth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const payload = await response.json();
    if (!response.ok) {
      const msg = payload?.message || "Request failed";
      const detail = payload?.detail ? ` — ${payload.detail}` : "";
      return { data: null, error: `${msg}${detail}` };
    }
    return { data: (payload.data ?? payload) as T, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlacesMap = Record<string, string[]>;

export type AdminTown = {
  id: string;
  city_id: string;
  name_ar: string;
  display_order: number;
};

export type AdminCity = {
  id: string;
  name_ar: string;
  display_order: number;
  towns: AdminTown[];
};

// ─── Public ─────────────────────────────────────────────────────────────────

/** جلب خريطة مدن→بلدات للتسجيل (بدون توكن) */
export async function fetchSignupPlacesMap(): Promise<{ data: PlacesMap | null; error: string | null }> {
  const res = await apiFetch<{ places: PlacesMap }>("/signup-places");
  if (res.error) return { data: null, error: res.error };
  return { data: res.data?.places ?? {}, error: null };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/** شجرة المدن والبلدات مع IDs للمشرف */
export async function fetchSignupPlacesAdmin(): Promise<{ data: AdminCity[] | null; error: string | null }> {
  const res = await apiFetch<{ cities: AdminCity[] }>("/signup-places/admin", {}, true);
  if (res.error) return { data: null, error: res.error };
  return { data: res.data?.cities ?? [], error: null };
}

/** إضافة مدينة */
export async function addCity(name_ar: string, display_order = 0) {
  return apiFetch<AdminCity>("/signup-places/cities", {
    method: "POST",
    body: JSON.stringify({ name_ar, display_order }),
  }, true);
}

/** تعديل مدينة */
export async function updateCity(cityId: string, payload: { name_ar?: string; display_order?: number }) {
  return apiFetch<AdminCity>(`/signup-places/cities/${cityId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

/** حذف مدينة */
export async function deleteCity(cityId: string) {
  return apiFetch<{ id: string; name_ar: string }>(`/signup-places/cities/${cityId}`, {
    method: "DELETE",
  }, true);
}

/** إضافة بلدة */
export async function addTown(cityId: string, name_ar: string, display_order = 0) {
  return apiFetch<AdminTown>(`/signup-places/cities/${cityId}/towns`, {
    method: "POST",
    body: JSON.stringify({ name_ar, display_order }),
  }, true);
}

/** تعديل بلدة */
export async function updateTown(townId: string, payload: { name_ar?: string; display_order?: number }) {
  return apiFetch<AdminTown>(`/signup-places/towns/${townId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

/** حذف بلدة */
export async function deleteTown(townId: string) {
  return apiFetch<{ id: string; city_id: string; name_ar: string }>(`/signup-places/towns/${townId}`, {
    method: "DELETE",
  }, true);
}
