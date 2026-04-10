import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Truck, 
  Bus, 
  Bike, 
  Tractor, 
  Trophy, 
  BookOpen, 
  Target,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { api as apiClient } from '@/integrations/api/client';

type License = {
  id: string;
  code: string;
  name_ar: string;
  icon_url?: string | null;
  difficulty_level?: string | null;
  bg_color?: string | null;
  display_order: number;
};

type QuestionWithLicenses = {
  licenses?: Array<{ id: string; code: string; name_ar: string }>;
};

function getLicenseMeta(code: string) {
  const normalized = code.toUpperCase();
  if (normalized === 'B') return { fallbackIcon: Car, iconColor: 'text-primary' };
  if (normalized === 'C1') return { fallbackIcon: Truck, iconColor: 'text-orange-600' };
  if (normalized === 'C') return { fallbackIcon: Truck, iconColor: 'text-amber-700' };
  if (normalized === 'D1') return { fallbackIcon: Bus, iconColor: 'text-blue-600' };
  if (normalized === 'A') return { fallbackIcon: Bike, iconColor: 'text-red-600' };
  if (normalized === 'T') return { fallbackIcon: Tractor, iconColor: 'text-green-600' };
  return { fallbackIcon: Car, iconColor: 'text-primary' };
}

const Questions = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [questions, setQuestions] = useState<QuestionWithLicenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: licensesData }, questionsRes] = await Promise.all([
          apiClient.from('licenses').select().order('display_order', { ascending: true }),
          fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:4000')}/api/questions`),
        ]);

        setLicenses((licensesData as License[]) || []);
        if (questionsRes.ok) {
          const payload = await questionsRes.json();
          setQuestions((payload?.data as QuestionWithLicenses[]) || []);
        } else {
          setQuestions([]);
        }
      } catch {
        setLicenses([]);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const questionCountByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const question of questions) {
      for (const license of question.licenses || []) {
        const code = (license.code || '').toUpperCase();
        if (!code) continue;
        map.set(code, (map.get(code) || 0) + 1);
      }
    }
    return map;
  }, [questions]);

  const categories = useMemo(
    () =>
      licenses.map((license) => {
        const meta = getLicenseMeta(license.code);
        return {
          id: license.id,
          code: license.code,
          title: `أسئلة تؤوريا ${license.name_ar}`,
          icon: meta.fallbackIcon,
          iconUrl: license.icon_url || '',
          description: `اختبار التؤوريا لرخصة ${license.name_ar}`,
          questions: questionCountByCode.get(license.code.toUpperCase()) || 0,
          difficulty: license.difficulty_level || 'متوسط',
          color: meta.iconColor,
          bgColor: license.bg_color || '#ffffff',
        };
      }),
    [licenses, questionCountByCode]
  );

  const features = [
    {
      icon: Target,
      title: 'أسئلة حقيقية',
      description: 'أسئلة مطابقة للامتحان الرسمي'
    },
    {
      icon: Trophy,
      title: 'نتائج فورية',
      description: 'احصل على نتيجتك مباشرة بعد الانتهاء'
    },
    {
      icon: BookOpen,
      title: 'شرح تفصيلي',
      description: 'شرح وافٍ لكل إجابة صحيحة وخاطئة'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              بنك الأسئلة الشامل
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              أسئلة التؤوريا الكاملة
            </h1>
            <p className="text-xl text-white/90 mb-8">
              استعد للامتحان النظري بأسئلة حقيقية ومحدثة لجميع أنواع الرخص
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">150+</div>
                <div className="text-sm text-white/80">سؤال متاح</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/80">نسبة النجاح</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">{isLoading ? '...' : categories.length}</div>
                <div className="text-sm text-white/80">أنواع رخص</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/50 hover:shadow-card transition-all duration-300"
              >
                <div className="p-3 rounded-lg bg-gradient-primary">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              اختر نوع الرخصة
            </h2>
            <p className="text-xl text-muted-foreground">
              ابدأ حل الأسئلة حسب نوع الرخصة المطلوبة
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {isLoading && (
              <div className="col-span-full text-center py-10 text-muted-foreground">جاري تحميل أنواع الرخص...</div>
            )}
            {!isLoading && categories.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                لا توجد رخص مفعلة حالياً لعرض الأسئلة.
              </div>
            )}
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={category.id}
                  className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-white/80 backdrop-blur-sm"
                  onClick={() =>
                    category.code.toUpperCase() === 'B'
                      ? navigate('/questions/private')
                      : navigate(`/mock-exam?category=${category.code}&difficulty=medium&exam=1`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: category.bgColor }}
                      >
                        {category.iconUrl ? (
                          <img
                            src={category.iconUrl}
                            alt={category.title}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <Icon className={`h-8 w-8 ${category.color}`} />
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {category.questions} سؤال
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-right mb-2">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-right text-base">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">المستوى:</span>
                      <Badge variant="outline">{category.difficulty}</Badge>
                    </div>
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-300"
                      variant="outline"
                    >
                      <span>ابدأ الاختبار</span>
                      <ChevronRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Study Materials Section */}
      <section className="py-16 bg-gradient-card border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                مواد دراسية إضافية
              </h2>
              <p className="text-xl text-muted-foreground">
                استفد من المواد التعليمية لتحسين فرص نجاحك
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="p-4 rounded-xl bg-gradient-primary w-fit mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-right">إشارات المرور</CardTitle>
                  <CardDescription className="text-right">
                    تعلم جميع إشارات المرور الرسمية مع الشرح التفصيلي
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" onClick={() => navigate("/signs")}>
                    <span>تصفح الإشارات</span>
                    <ChevronRight className="mr-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="p-4 rounded-xl bg-gradient-primary w-fit mb-4">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-right">كتاب التؤوريا</CardTitle>
                  <CardDescription className="text-right">
                    الكتاب الرسمي الكامل لقوانين السير والمرور
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <span>تحميل الكتاب</span>
                    <ChevronRight className="mr-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Success Tips Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20 bg-gradient-card">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-full bg-gradient-primary w-fit mb-4">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl">نصائح للنجاح في الامتحان</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-right">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">تدرب على الأقل 50 سؤال يومياً قبل الامتحان</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">راجع الإجابات الخاطئة وافهم السبب</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">احفظ جميع إشارات المرور ومعانيها</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">اقرأ الأسئلة بتمعن قبل اختيار الإجابة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">لا تتسرع في الإجابة - لديك وقت كافٍ</span>
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

export default Questions;