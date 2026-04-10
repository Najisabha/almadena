import { api as apiClient } from "@/integrations/api/client";

export async function isCurrentUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await apiClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
