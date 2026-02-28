import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  BookOpen, 
  PenTool, 
  Trophy, 
  Bell, 
  Calendar,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  // Mock student data
  const studentData = {
    name: 'أحمد محمد',
    nationalId: '1234567890',
    idType: 'هوية شخصية',
    licenseType: 'رخصة خصوصية',
    profilePicture: '/placeholder-avatar.jpg',
    progress: {
      theory: 75,
      practice: 60,
      exams: 85
    },
    recentExams: [
      { id: 1, type: 'امتحان تجريبي', score: 28, total: 30, date: '2024-01-15', status: 'نجح' },
      { id: 2, type: 'إشارات المرور', score: 25, total: 30, date: '2024-01-12', status: 'نجح' },
      { id: 3, type: 'قوانين السير', score: 22, total: 30, date: '2024-01-10', status: 'رسب' }
    ],
    notifications: [
      { id: 1, message: 'امتحانك النظري غداً الساعة 10:00 صباحاً', type: 'exam', time: '2 ساعات' },
      { id: 2, message: 'تم إضافة أسئلة جديدة لقسم الميكانيك', type: 'update', time: '1 يوم' },
      { id: 3, message: 'درس القيادة العملية يوم الأحد', type: 'lesson', time: '3 أيام' }
    ]
  };

  const quickActions = [
    { title: 'امتحان تجريبي', icon: PenTool, color: 'bg-primary', href: '/exams' },
    { title: 'أسئلة التووري', icon: BookOpen, color: 'bg-accent', href: '/questions' },
    { title: 'دراسة المنهج', icon: BookOpen, color: 'bg-success', href: '/study' },
    { title: 'النتائج', icon: Trophy, color: 'bg-warning', href: '/results' }
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم الطالب</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة التحكم الخاصة بك</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Student Profile */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center space-x-6 rtl:space-x-reverse mb-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{studentData.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{studentData.idType}: {studentData.nationalId}</Badge>
                    <Badge variant="outline">{studentData.licenseType}</Badge>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">التقدم النظري</span>
                    <span className="text-sm text-muted-foreground">{studentData.progress.theory}%</span>
                  </div>
                  <Progress value={studentData.progress.theory} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">التقدم العملي</span>
                    <span className="text-sm text-muted-foreground">{studentData.progress.practice}%</span>
                  </div>
                  <Progress value={studentData.progress.practice} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">نتائج الامتحانات</span>
                    <span className="text-sm text-muted-foreground">{studentData.progress.exams}%</span>
                  </div>
                  <Progress value={studentData.progress.exams} className="h-2" />
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-6">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-button transition-shadow duration-200"
                  >
                    <div className={`${action.color} w-8 h-8 rounded-lg flex items-center justify-center`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.title}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Recent Exams */}
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-6">آخر النتائج التجريبية</h3>
              <div className="space-y-4">
                {studentData.recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        exam.status === 'نجح' ? 'bg-success' : 'bg-destructive'
                      }`}>
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{exam.type}</h4>
                        <p className="text-sm text-muted-foreground">{exam.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{exam.score}/{exam.total}</p>
                      <Badge variant={exam.status === 'نجح' ? 'default' : 'destructive'}>
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">الإشعارات</h3>
              </div>
              <div className="space-y-4">
                {studentData.notifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                      <Badge variant="outline" className="text-xs">
                        {notification.type === 'exam' && <Calendar className="h-3 w-3 mr-1" />}
                        {notification.type === 'update' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {notification.type === 'lesson' && <Clock className="h-3 w-3 mr-1" />}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-6">إحصائيات سريعة</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">امتحانات مكتملة</span>
                  <span className="font-bold text-foreground">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ساعات دراسة</span>
                  <span className="font-bold text-foreground">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">معدل النجاح</span>
                  <span className="font-bold text-success">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الترتيب</span>
                  <span className="font-bold text-primary">15 من 120</span>
                </div>
              </div>
            </Card>

            {/* Next Appointment */}
            <Card className="p-6 shadow-card bg-gradient-secondary/10">
              <h3 className="text-lg font-bold text-foreground mb-4">الموعد القادم</h3>
              <div className="text-center">
                <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-semibold text-foreground">امتحان نظري</p>
                <p className="text-sm text-muted-foreground">غداً - 10:00 صباحاً</p>
                <Button size="sm" className="mt-3">
                  عرض التفاصيل
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;