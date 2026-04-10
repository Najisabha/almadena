import { useEffect, useState } from "react";
import { isCurrentUserAdmin } from "@/features/admin/admin.service";
import { useAuth } from "@/features/auth/AuthProvider";

export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      try {
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        setIsAdmin(await isCurrentUserAdmin(user.id));
      } catch (error) {
        console.error("Error in checkAdminRole:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    void checkAdminRole();
  }, [user]);

  return { isAdmin, isLoading };
};
