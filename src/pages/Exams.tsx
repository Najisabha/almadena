import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Clock, 
  FileCheck, 
  TrendingUp, 
  Target,
  CheckCircle2,
  AlertCircle,
  Play,
  History,
  Star
} from 'lucide-react';

const Exams = () => {
  const mockExams = [
    {
      id: 1,
      title: 'امتحان تجريبي 1 - خصوصي',
      type: 'private',
      duration: 40,
      questions: 30,
      passScore: 23,
      difficulty: 'متوسط',
      attempts: 245,
      avgScore: 85
    },
    {
      id: 2,
      title: 'امتحان تجريبي 2 - خصوصي',
      type: 'private',
      duration: 40,
      questions: 30,
      passScore: 23,
      difficulty: 'متقدم',
      attempts: 189,
      avgScore: 78
    },
    {
      id: 3,
      title: 'امتحان شامل - جميع الأنواع',
      type: 'comprehensive',
      duration: 45,
      questions: 35,
      passScore: 27,
      difficulty: 'متقدم',
      attempts: 156,
      avgScore: 82
    },
    {
      id: 4,
      title: 'امتحان سريع - 15 دقيقة',
      type: 'quick',
      duration: 15,
      questions: 15,
      passScore: 12,
      difficulty: 'أساسي',
      attempts: 412,
      avgScore: 88
    }
  ];

  const myHistory = [
    {
      id: 1,
      examTitle: 'امتحان تجريبي 1',
      date: '2024-01-15',
      score: 27,
      total: 30,
      passed: true,
      duration: 35
    },
    {
      id: 2,
      examTitle: 'امتحان شامل',
      date: '2024-01-14',
      score: 25,
      total: 35,
      passed: false,
      duration: 42
    },
    {
      id: 3,
      examTitle: 'امتحان سريع',
      date: '2024-01-13',
      score: 14,
      total: 15,
      passed: true,
      duration: 12
    }
  ];

  const stats = [
    {
      icon: Award,
      label: 'امتحانات متاحة',
      value: '12+',
      color: 'text-primary'
    },
    {
      icon: TrendingUp,
      label: 'معدل النجاح',
      value: '94%',
      color: 'text-green-600'
    },
    {
      icon: Target,
      label: 'طلاب نشطون',
      value: '500+',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              نظام الامتحانات التجريبية
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              امتحانات تجريبية محاكية
            </h1>
            <p className="text-xl text-white/90 mb-8">
              اختبر مستواك بامتحانات مطابقة تماماً للامتحان الرسمي
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/50">
              <div className="p-3 rounded-lg bg-gradient-primary w-fit mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">توقيت حقيقي</h3>
              <p className="text-sm text-muted-foreground">مثل الامتحان الفعلي</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/50">
              <div className="p-3 rounded-lg bg-gradient-primary w-fit mx-auto mb-4">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">تقييم فوري</h3>
              <p className="text-sm text-muted-foreground">نتائج وتحليل مباشر</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/50">
              <div className="p-3 rounded-lg bg-gradient-primary w-fit mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">تتبع التقدم</h3>
              <p className="text-sm text-muted-foreground">راقب تحسن أدائك</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/50">
              <div className="p-3 rounded-lg bg-gradient-primary w-fit mx-auto mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">شهادات إنجاز</h3>
              <p className="text-sm text-muted-foreground">اثبت كفاءتك</p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Exams Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              الامتحانات المتاحة
            </h2>
            <p className="text-xl text-muted-foreground">
              اختر امتحاناً وابدأ التجربة الآن
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {mockExams.map((exam) => (
              <Card 
                key={exam.id}
                className="group hover:shadow-elevated transition-all duration-300 border-2 hover:border-primary/50 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {exam.difficulty}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{exam.avgScore}% معدل</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl text-right mb-2">
                    {exam.title}
                  </CardTitle>
                  <CardDescription className="text-right">
                    امتحان شامل يحاكي الامتحان الرسمي بدقة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-gradient-card">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-bold">{exam.duration} دقيقة</div>
                      <div className="text-xs text-muted-foreground">المدة</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-card">
                      <FileCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-bold">{exam.questions} سؤال</div>
                      <div className="text-xs text-muted-foreground">الأسئلة</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-card">
                      <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-bold">{exam.passScore}/{exam.questions}</div>
                      <div className="text-xs text-muted-foreground">النجاح</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                    <span>{exam.attempts} طالب جرّب هذا الامتحان</span>
                  </div>

                  <Button 
                    className="w-full group-hover:shadow-button transition-all duration-300"
                  >
                    <Play className="ml-2 h-4 w-4" />
                    <span>ابدأ الامتحان الآن</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* My History Section */}
      <section className="py-16 bg-gradient-card border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-foreground">سجل امتحاناتي</h2>
                <p className="text-muted-foreground">آخر الامتحانات التي قمت بها</p>
              </div>
              <Button variant="outline">
                <History className="ml-2 h-4 w-4" />
                عرض الكل
              </Button>
            </div>

            <div className="space-y-4">
              {myHistory.map((result) => (
                <Card 
                  key={result.id}
                  className="border-2 hover:border-primary/30 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                          {result.passed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 text-right">{result.examTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {result.score}/{result.total}
                          </div>
                          <div className="text-xs text-muted-foreground">النتيجة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {Math.round((result.score / result.total) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">النسبة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{result.duration}</div>
                          <div className="text-xs text-muted-foreground">دقيقة</div>
                        </div>
                        <Badge 
                          variant={result.passed ? "default" : "destructive"}
                          className="h-8"
                        >
                          {result.passed ? "ناجح" : "راسب"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-full bg-gradient-primary w-fit mb-4">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl">نصائح لامتحان ناجح</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-right">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">تأكد من وجود اتصال إنترنت مستقر قبل البدء</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">اجلس في مكان هادئ ومريح دون مشتتات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">راقب الوقت المتبقي بانتظام</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">ابدأ بالأسئلة السهلة ثم انتقل للصعبة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">راجع إجاباتك قبل تسليم الامتحان</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Exams;