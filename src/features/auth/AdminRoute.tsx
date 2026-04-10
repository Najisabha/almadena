import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isCurrentUserAdmin } from "@/features/admin/admin.service";
import { useAuth } from "./AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!user) {
        setIsChecking(false);
        setIsAdmin(false);
        return;
      }

      try {
        const admin = await isCurrentUserAdmin(user.id);
        if (active) {
          setIsAdmin(admin);
        }
      } catch {
        if (active) {
          setIsAdmin(false);
        }
      } finally {
        if (active) {
          setIsChecking(false);
        }
      }
    }

    setIsChecking(true);
    void checkAdmin();

    return () => {
      active = false;
    };
  }, [user]);

  if (isChecking) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        جاري التحقق من صلاحيات الادمن...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminRoute>{children}</AdminRoute>
    </ProtectedRoute>
  );
}
