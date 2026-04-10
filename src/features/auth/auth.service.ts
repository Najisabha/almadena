import { api as apiClient } from "@/integrations/api/client";

export type AuthUser = {
  id: string;
  idNumber: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await apiClient.auth.getUser();
  return user;
}

export async function signOut() {
  await apiClient.auth.signOut();
}
