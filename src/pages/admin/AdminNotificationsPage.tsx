import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminStudentNotifications } from '@/components/admin/AdminStudentNotifications';
import AdminNavigation from '@/components/admin/AdminNavigation';

const AdminNotificationsPage = () => {
  const { isAdmin, isLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <AdminNavigation />
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <AdminStudentNotifications />
      </div>
    </>
  );
};

export default AdminNotificationsPage;
