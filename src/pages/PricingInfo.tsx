import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Truck, TramFront, Bike, Tractor, CheckCircle2, Star, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingInfo = () => {
  const packages = [
    {
      type: 'رخصة خاصة',
      icon: Car,
      color: 'bg-blue-500',
      popular: true,
      packages: [
        {
          name: 'الباقة الأساسية',
          price: '2,800',
          features: [
            '28 ساعة تدريب نظري',
            '28 ساعة تدريب عملي',
            'كتاب التووريا الرسمي',
            'امتحان تجريبي واحد',
            'متابعة أسبوعية'
          ]
        },
        {
          name: 'الباقة الذهبية',
          price: '3,500',
          features: [
            '28 ساعة تدريب نظري',
            '35 ساعة تدريب عملي',
            'كتاب التووريا + مواد إضافية',
            '3 امتحانات تجريبية',
            'متابعة يومية',
            'جلسة استشارة قبل الامتحان'
          ],
          recommended: true
        }
      ]
    },
    {
      type: 'رخصة شاحنة',
      icon: Truck,
      color: 'bg-orange-500',
      packages: [
        {
          name: 'الباقة الأساسية',
          price: '5,500',
          features: [
            '40 ساعة تدريب نظري',
            '50 ساعة تدريب عملي',
            'كتيب قوانين الشاحنات',
            'امتحان تجريبي',
            'متابعة أسبوعية'
          ]
        },
        {
          name: 'الباقة الاحترافية',
          price: '6,800',
          features: [
            '40 ساعة تدريب نظري',
            '65 ساعة تدريب عملي',
            'كتيب + مواد تدريبية',
            '4 امتحانات تجريبية',
            'متابعة يومية',
            'تدريب على أنواع شاحنات متعددة'
          ],
          recommended: true
        }
      ]
    },
    {
      type: 'رخصة أجرة',
      icon: TramFront,
      color: 'bg-yellow-500',
      packages: [
        {
          name: 'الباقة الشاملة',
          price: '4,200',
          features: [
            '35 ساعة تدريب نظري',
            '30 ساعة تدريب عملي',
            'اختبار معرفة الطرق',
            'دليل المواقع المهمة',
            '3 امتحانات تجريبية',
            'متابعة مستمرة'
          ]
        }
      ]
    },
    {
      type: 'رخصة دراجة نارية',
      icon: Bike,
      color: 'bg-red-500',
      packages: [
        {
          name: 'الباقة الأساسية',
          price: '2,200',
          features: [
            '20 ساعة تدريب نظري',
            '20 ساعة تدريب عملي',
            'كتيب قوانين الدراجات',
            'امتحان تجريبي',
            'معدات السلامة'
          ]
        }
      ]
    },
    {
      type: 'رخصة معدات ثقيلة',
      icon: Tractor,
      color: 'bg-green-500',
      packages: [
        {
          name: 'الباقة المتقدمة',
          price: '7,500',
          features: [
            '45 ساعة تدريب نظري',
            '60 ساعة تدريب عملي',
            'تدريب على معدات متنوعة',
            'شهادة معتمدة',
            '4 امتحانات تجريبية',
            'متابعة احترافية'
          ]
        }
      ]
    }
  ];

  const additionalServices = [
    { name: 'ساعة تدريب عملي إضافية', price: '80' },
    { name: 'امتحان تجريبي إضافي', price: '100' },
    { name: 'جلسة استشارة قبل الامتحان', price: '150' },
    { name: 'إعادة اختبار التووريا', price: '200' },
    { name: 'التدريب في أيام العطل (بالساعة)', price: '120' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              أسعار تنافسية وشفافة
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              أسعار <span className="text-primary">الدروس</span> والباقات
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              باقات مرنة تناسب جميع الاحتياجات بأسعار تنافسية وشفافة بدون رسوم خفية
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {packages.map((licenseType, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className={`${licenseType.color} p-3 rounded-xl text-white shadow-button`}>
                    <licenseType.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">{licenseType.type}</h2>
                  {licenseType.popular && (
                    <Badge className="bg-yellow-500 text-white border-0">
                      <Star className="h-3 w-3 ml-1 fill-white" />
                      الأكثر طلباً
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {licenseType.packages.map((pkg, pkgIdx) => (
                    <Card 
                      key={pkgIdx} 
                      className={`relative overflow-hidden border-2 ${
                        pkg.recommended 
                          ? 'border-primary shadow-elevated scale-105' 
                          : 'border-border/50'
                      } bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300`}
                    >
                      {pkg.recommended && (
                        <div className="absolute top-0 left-0 right-0">
                          <div className="bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
                            الأكثر اختياراً ⭐
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className={pkg.recommended ? 'pt-12' : ''}>
                        <CardTitle className="text-center">
                          <div className="text-xl font-bold text-foreground mb-2">{pkg.name}</div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-primary">{pkg.price}</span>
                            <span className="text-muted-foreground">ريال</span>
                          </div>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                          {pkg.features.map((feature, featureIdx) => (
                            <li key={featureIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          className={`w-full ${pkg.recommended ? 'bg-gradient-primary shadow-button' : ''}`}
                          asChild
                        >
                          <Link to="/contact">احجز الآن</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">خدمات إضافية</h2>
            <p className="text-muted-foreground">خدمات اختيارية لتعزيز تجربة التعلم</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {additionalServices.map((service, idx) => (
                    <li key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/30">
                      <span className="text-foreground font-medium">{service.name}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-primary">{service.price}</span>
                        <span className="text-sm text-muted-foreground">ريال</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center">ملاحظات مهمة</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>الأسعار لا تشمل رسوم المرور الحكومية</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>إمكانية التقسيط على دفعات بدون فوائد</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>خصومات خاصة للطلاب والطالبات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>جميع الأسعار تشمل ضريبة القيمة المضافة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>استرجاع 50% من قيمة الباقة في حالة الإلغاء خلال أسبوع من التسجيل</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل لديك استفسار عن الأسعار؟</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                تواصل معنا للحصول على استشارة مجانية واختيار الباقة المناسبة لك
              </p>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link to="/contact">
                  <Phone className="ml-2 h-5 w-5" />
                  اتصل بنا الآن
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PricingInfo;