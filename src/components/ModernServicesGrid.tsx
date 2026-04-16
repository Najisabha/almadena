import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Phone, 
  Trophy,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const ModernServicesGrid = () => {
  const mainServices = [
    {
      id: 'theory-hub',
      icon: BookOpen,
      title: 'أسئلة التووريا والامتحانات التجريبية',
      subtitle: 'بنك أسئلة ومحاكاة الامتحان الرسمي',
      description:
        'أسئلة محدثة حسب نوع الرخصة مع امتحانات تجريبية مقسّمة، وتوقيت مطابق للامتحان الفعلي ونتائج فورية وسجل تقدم على جهازك.',
      features: [
        'تصنيف حسب الرخصة من قاعدة البيانات',
        'دفعات 30 سؤالاً',
        'توقيت ساعة كاملة',
        'سجل امتحانات محلي',
      ],
      gradient: 'bg-gradient-to-br from-blue-500 to-emerald-600',
      badge: 'الأكثر استخداماً',
      href: '/questions',
    },
  ];

  const additionalServices = [
    {
      icon: GraduationCap,
      title: 'متطلبات الرخصة',
      description: 'شروط وأنواع الرخص وساعات التدريب المحدثة من الإدارة',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/license-requirements'
    },
    {
      icon: FileText,
      title: 'دليل الحصول على الرخصة',
      description: 'خطوات مفصلة للحصول على رخصة القيادة',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/license-guide'
    },
    {
      icon: Trophy,
      title: 'النتائج والإحصائيات',
      description: 'تتبع تقدمك ونتائجك بشكل تفصيلي',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/student-results'
    },
    {
      icon: Phone,
      title: 'الدعم والمساعدة',
      description: 'تواصل معنا عبر صفحة الاتصال للاستفسار والمتابعة',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/contact'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            خدمات متطورة ومبتكرة
          </Badge>
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            منصة <span className="bg-gradient-primary bg-clip-text text-transparent">شاملة</span> لتعلم القيادة
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            اكتشف الخدمات التي تساعدك على الاستعداد لرخصة القيادة والامتحانات
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="max-w-3xl mx-auto mb-16">
          {mainServices.map((service) => (
            <Card key={service.id} className="relative overflow-hidden border-0 shadow-elevated hover:shadow-hero transition-all duration-700 group bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
              
              {/* Badge */}
              <div className="absolute top-6 left-6 rtl:right-6 rtl:left-auto">
                <Badge className="bg-primary text-primary-foreground">
                  {service.badge}
                </Badge>
              </div>

              <div className="relative p-8">
                {/* Icon */}
                <div className={`${service.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-lg text-primary font-semibold mb-4">{service.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2 rtl:ml-2 rtl:mr-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Button */}
                <Button 
                  className="w-full shadow-button group-hover:shadow-elevated transition-all duration-300 text-lg py-6"
                  size="lg"
                  asChild
                >
                  <Link to={service.href}>
                    <span>ابدأ الآن</span>
                    <ArrowLeft className="mr-2 h-5 w-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Services */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {additionalServices.map((service, index) => (
            <Link key={index} to={service.href}>
              <Card className="p-6 hover:shadow-elevated transition-all duration-500 group cursor-pointer border-0 bg-white">
                <div className={`${service.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModernServicesGrid;