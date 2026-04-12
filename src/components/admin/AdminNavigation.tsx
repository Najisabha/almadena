import { Link, useLocation } from 'react-router-dom';
import { Users, Trophy, FileText, DollarSign, Calendar, BookOpen, Settings, TrafficCone, IdCard, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminNavigation = () => {
  const location = useLocation();

  const navItems = [
    { title: 'الطلاب', href: '/admin/students', icon: Users },
    { title: 'الإشعارات', href: '/admin/notifications', icon: Bell },
    { title: 'قصص النجاح', href: '/admin/success-stories', icon: Trophy },
    { title: 'الأسئلة', href: '/admin/questions', icon: FileText },
    { title: 'الرخص', href: '/admin/licenses', icon: IdCard },
    { title: 'الأسعار', href: '/admin/pricing', icon: DollarSign },
    { title: 'المواعيد', href: '/admin/appointments', icon: Calendar },
    { title: 'المواد الدراسية', href: '/admin/materials', icon: BookOpen },
    { title: 'الإشارات', href: '/admin/signs', icon: TrafficCone },
    { title: 'إعدادات الموقع', href: '/admin/settings', icon: Settings },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-20 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
