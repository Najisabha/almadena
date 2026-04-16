import { api as apiClient } from "@/integrations/api/client";

export async function isCurrentUserAdmin(_userId: string): Promise<boolean> {
  return apiClient.checkIsAdmin();
}
