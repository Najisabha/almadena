import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Truck, TramFront, Bike, Tractor, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react';

const LicenseRequirements = () => {
  const licenses = [
    {
      type: 'رخصة خاصة',
      icon: Car,
      color: 'bg-blue-500',
      minAge: '18 سنة',
      requirements: [
        'بطاقة هوية وطنية سارية المفعول',
        'فحص طبي من مركز معتمد',
        'صور شخصية حديثة (4×6)',
        'اجتياز الفحص النظري (التووريا)',
        'اجتياز الفحص العملي',
        'دفع الرسوم المقررة'
      ],
      duration: '2-3 أشهر',
      theoryHours: '28 ساعة',
      practicalHours: '28 ساعة'
    },
    {
      type: 'رخصة شاحنة',
      icon: Truck,
      color: 'bg-orange-500',
      minAge: '20 سنة',
      requirements: [
        'الحصول على رخصة خاصة لمدة سنتين على الأقل',
        'بطاقة هوية وطنية سارية المفعول',
        'فحص طبي شامل من مركز معتمد',
        'صور شخصية حديثة (4×6)',
        'اجتياز الفحص النظري الخاص بالشاحنات',
        'اجتياز الفحص العملي على شاحنة',
        'شهادة حسن سيرة وسلوك',
        'دفع الرسوم المقررة'
      ],
      duration: '3-4 أشهر',
      theoryHours: '40 ساعة',
      practicalHours: '50 ساعة'
    },
    {
      type: 'رخصة أجرة (تاكسي)',
      icon: TramFront,
      color: 'bg-yellow-500',
      minAge: '21 سنة',
      requirements: [
        'الحصول على رخصة خاصة لمدة 3 سنوات على الأقل',
        'بطاقة هوية وطنية سارية المفعول',
        'فحص طبي شامل',
        'اختبار معرفة الطرق والمواقع',
        'شهادة حسن سيرة وسلوك',
        'صور شخصية حديثة (4×6)',
        'عدم وجود مخالفات مرورية خطيرة',
        'دفع الرسوم المقررة'
      ],
      duration: '2-3 أشهر',
      theoryHours: '35 ساعة',
      practicalHours: '30 ساعة'
    },
    {
      type: 'رخصة دراجة نارية',
      icon: Bike,
      color: 'bg-red-500',
      minAge: '18 سنة',
      requirements: [
        'بطاقة هوية وطنية سارية المفعول',
        'فحص طبي من مركز معتمد',
        'صور شخصية حديثة (4×6)',
        'اجتياز الفحص النظري للدراجات النارية',
        'اجتياز الفحص العملي',
        'خوذة واقية معتمدة',
        'دفع الرسوم المقررة'
      ],
      duration: '1-2 شهر',
      theoryHours: '20 ساعة',
      practicalHours: '20 ساعة'
    },
    {
      type: 'رخصة معدات ثقيلة',
      icon: Tractor,
      color: 'bg-green-500',
      minAge: '21 سنة',
      requirements: [
        'الحصول على رخصة خاصة لمدة سنتين',
        'بطاقة هوية وطنية سارية المفعول',
        'فحص طبي شامل',
        'شهادة تدريب على المعدات الثقيلة',
        'اجتياز الفحص النظري والعملي',
        'صور شخصية حديثة (4×6)',
        'دفع الرسوم المقررة'
      ],
      duration: '3-4 أشهر',
      theoryHours: '45 ساعة',
      practicalHours: '60 ساعة'
    }
  ];

  const generalSteps = [
    {
      step: '1',
      title: 'التسجيل في الأكاديمية',
      description: 'قم بالتسجيل وتقديم المستندات المطلوبة'
    },
    {
      step: '2',
      title: 'الدورة النظرية',
      description: 'احضر المحاضرات النظرية وادرس قوانين المرور'
    },
    {
      step: '3',
      title: 'الفحص النظري (التووريا)',
      description: 'اجتاز امتحان التووريا بنجاح'
    },
    {
      step: '4',
      title: 'التدريب العملي',
      description: 'ابدأ التدريب العملي على القيادة'
    },
    {
      step: '5',
      title: 'الفحص العملي',
      description: 'اجتاز الفحص العملي في قسم المرور'
    },
    {
      step: '6',
      title: 'استلام الرخصة',
      description: 'احصل على رخصة القيادة الخاصة بك'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              معلومات شاملة
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              متطلبات <span className="text-primary">الرخص</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تعرف على المتطلبات والشروط اللازمة للحصول على رخصة القيادة بمختلف أنواعها
            </p>
          </div>
        </div>
      </section>

      {/* General Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">خطوات الحصول على الرخصة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {generalSteps.map((item, index) => (
              <Card key={index} className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-bl-full"></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-button">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* License Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">أنواع الرخص ومتطلباتها</h2>
          <div className="space-y-8">
            {licenses.map((license, index) => (
              <Card key={index} className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-elevated transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
                  <div className="flex items-center gap-4">
                    <div className={`${license.color} p-3 rounded-xl text-white shadow-button`}>
                      <license.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{license.type}</CardTitle>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>الحد الأدنى للعمر: {license.minAge}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>المدة: {license.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Requirements */}
                    <div className="lg:col-span-2">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        المتطلبات والشروط
                      </h3>
                      <ul className="space-y-3">
                        {license.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Training Info */}
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                        <h4 className="font-semibold text-foreground mb-3 text-center">ساعات التدريب</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">نظري:</span>
                            <Badge variant="outline">{license.theoryHours}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">عملي:</span>
                            <Badge variant="outline">{license.practicalHours}</Badge>
                          </div>
                          <div className="pt-3 border-t border-border/30">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-foreground">الإجمالي:</span>
                              <Badge className="bg-primary">{parseInt(license.theoryHours) + parseInt(license.practicalHours)} ساعة</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                        <p className="text-xs text-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 inline-block ml-1" />
                          المدة التقريبية: {license.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل أنت مستعد للبدء؟</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                سجل الآن وابدأ رحلتك للحصول على رخصة القيادة مع أكاديمية المدينة
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                سجل الآن
                <CheckCircle2 className="h-5 w-5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LicenseRequirements;