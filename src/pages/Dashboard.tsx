import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  BookOpen,
  Trophy,
  Bell,
  SignpostBig,
  Target,
  BarChart2,
  ClipboardList,
  Phone,
  Medal,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { api as apiClient, ExamAttempt, StudentNotification } from '@/integrations/api/client';

type Profile = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_type?: string;
  avatar_url?: string;
};

type DashboardData = {
  theory_score: number | null;
  practical_score: number | null;
  total_exams: number;
  passed_exams: number;
  avg_percentage: number;
  recent_attempts: ExamAttempt[];
  rank: number | null;
  total_students: number;
};

const quickActions = [
  { title: 'الأسئلة والامتحانات', icon: BookOpen, color: 'bg-primary', href: '/questions' },
  { title: 'إشارات المرور', icon: SignpostBig, color: 'bg-success', href: '/signs' },
  { title: 'نتائج الطلاب', icon: ClipboardList, color: 'bg-warning', href: '/student-results' },
  { title: 'امتحان تجريبي', icon: Target, color: 'bg-destructive', href: '/mock-exam' },
];

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    apiClient
      .from<Profile>('profiles')
      .select('first_name,last_name,phone,license_type,avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDashboardLoading(true);
    apiClient
      .getDashboard()
      .then(({ data }) => setDashboard(data ?? null))
      .finally(() => setDashboardLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setNotifLoading(true);
    apiClient
      .getNotifications()
      .then(({ data }) => setNotifications(data ?? []))
      .finally(() => setNotifLoading(false));
  }, [user]);

  const markRead = async (id: string) => {
    await apiClient.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : null;

  const successRate =
    dashboard && dashboard.total_exams > 0
      ? Math.round((dashboard.passed_exams / dashboard.total_exams) * 100)
      : 0;

  // Estimated study hours: 1 hour per completed exam (approximate, displayed with note)
  const studyHours = dashboard ? dashboard.total_exams : 0;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم الطالب</h1>
          <p className="text-muted-foreground">
            مرحباً بك{fullName ? `، ${fullName}` : ''} في لوحة التحكم الخاصة بك
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Student Profile + Progress */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center space-x-6 rtl:space-x-reverse mb-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="صورة الملف الشخصي"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  {profileLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-40" />
                      <Skeleton className="h-5 w-56" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-foreground">
                        {fullName || 'الطالب'}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">رقم الهوية: {user?.idNumber ?? '—'}</Badge>
                        {profile?.license_type && (
                          <Badge variant="outline">{profile.license_type}</Badge>
                        )}
                        {profile?.phone && (
                          <Badge variant="outline" className="gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bars — sourced from admin (theory/practical) and exam history (avg) */}
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">التقدم النظري</span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard?.theory_score != null ? `${dashboard.theory_score}%` : '—'}
                      </span>
                    </div>
                    <Progress value={dashboard?.theory_score ?? 0} className="h-2" />
                    {dashboard?.theory_score == null && (
                      <p className="text-xs text-muted-foreground mt-1">تُحدَّد من قِبل الأكاديمية</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">التقدم العملي</span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard?.practical_score != null ? `${dashboard.practical_score}%` : '—'}
                      </span>
                    </div>
                    <Progress value={dashboard?.practical_score ?? 0} className="h-2" />
                    {dashboard?.practical_score == null && (
                      <p className="text-xs text-muted-foreground mt-1">تُحدَّد من قِبل الأكاديمية</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">نتائج الامتحانات</span>
                      <span className="text-sm text-muted-foreground">
                        {dashboard && dashboard.total_exams > 0 ? `${dashboard.avg_percentage}%` : '—'}
                      </span>
                    </div>
                    <Progress value={dashboard?.avg_percentage ?? 0} className="h-2" />
                    {dashboard && dashboard.total_exams === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">متوسط الإجابات الصحيحة في امتحاناتك التجريبية</p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-6">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-button transition-shadow duration-200"
                    asChild
                  >
                    <Link to={action.href}>
                      <div
                        className={`${action.color} w-8 h-8 rounded-lg flex items-center justify-center`}
                      >
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">
                        {action.title}
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Recent Exam Results */}
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-6">آخر النتائج التجريبية</h3>
              {dashboardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !dashboard || dashboard.recent_attempts.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">لم تُجرِ أي امتحان تجريبي بعد.</p>
                  <Button asChild size="sm">
                    <Link to="/mock-exam">ابدأ امتحاناً تجريبياً</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.recent_attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            attempt.passed ? 'bg-success' : 'bg-destructive'
                          }`}
                        >
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {attempt.license_name_ar} — امتحان {attempt.exam_number}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeDate(attempt.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {attempt.score}/{attempt.total_questions}
                        </p>
                        <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                          {attempt.passed ? 'نجح' : 'رسب'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">الإشعارات</h3>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {notifLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Bell className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">لا توجد إشعارات حالياً.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                        n.is_read
                          ? 'bg-muted/40 text-muted-foreground'
                          : 'bg-primary/10 text-foreground font-medium border border-primary/20'
                      }`}
                      onClick={() => !n.is_read && markRead(n.id)}
                    >
                      <p>{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeDate(n.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-6">إحصائيات سريعة</h3>
              {dashboardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">امتحانات مكتملة</span>
                    <span className="font-bold text-foreground">{dashboard?.total_exams ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">معدل النجاح</span>
                    <span className="font-bold text-success">
                      {dashboard && dashboard.total_exams > 0 ? `${successRate}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ساعات الدراسة
                    </span>
                    <span className="font-bold text-primary" title="تقدير تقريبي بناءً على عدد الامتحانات">
                      {studyHours > 0 ? `~${studyHours} ساعة` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Medal className="h-3.5 w-3.5" />
                      الترتيب
                    </span>
                    <span className="font-bold text-primary">
                      {dashboard?.rank != null
                        ? `${dashboard.rank} من ${dashboard.total_students}`
                        : '—'}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
