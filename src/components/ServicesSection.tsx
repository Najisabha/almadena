import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  PenTool, 
  GraduationCap, 
  FileText, 
  Phone, 
  Trophy,
  ArrowLeft 
} from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      icon: BookOpen,
      title: 'اسئلة التووريا',
      description: 'مكتبة شاملة من الأسئلة مصنفة حسب نوع الرخصة (عمومي/خصوصي/تراكتور)',
      features: ['أسئلة إشارات المرور', 'قوانين السير', 'الميكانيك الأساسي', 'امتحانات شاملة'],
      color: 'bg-primary',
      href: '/questions'
    },
    {
      icon: PenTool,
      title: 'الامتحانات التجريبية',
      description: 'محاكاة كاملة للامتحان الحقيقي مع توقيت زمني ونتائج فورية',
      features: ['30 سؤال عشوائي', 'توقيت محدد', 'نتائج فورية', 'تقييم الأداء'],
      color: 'bg-accent',
      href: '/exams'
    },
    {
      icon: GraduationCap,
      title: 'دراسة التووريا',
      description: 'دروس إلكترونية تفاعلية بالفيديو والـ PDF لجميع أقسام المنهج',
      features: ['فيديوهات تعليمية', 'ملفات PDF', 'شرح تفصيلي', 'أمثلة عملية'],
      color: 'bg-success',
      href: '/study'
    },
    {
      icon: FileText,
      title: 'الحصول على الرخصة',
      description: 'دليل شامل لإجراءات الحصول على رخصة القيادة والمواعيد الرسمية',
      features: ['الأوراق المطلوبة', 'الرسوم والأسعار', 'مواعيد الفحص', 'خطوات التقديم'],
      color: 'bg-warning',
      href: '/license-guide'
    },
    {
      icon: Trophy,
      title: 'النتائج',
      description: 'عرض نتائج الامتحانات النظرية والعملية مع إحصائيات مفصلة',
      features: ['نتائج نظرية', 'نتائج عملية', 'إحصائيات الأداء', 'صور الناجحين'],
      color: 'bg-destructive',
      href: '/results'
    },
    {
      icon: Phone,
      title: 'اتصل بنا',
      description: 'تواصل معنا للحصول على المساعدة أو الاستفسار عن الخدمات',
      features: ['نموذج التواصل', 'معلومات المركز', 'خريطة الموقع', 'أرقام الهاتف'],
      color: 'bg-muted',
      href: '/contact'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">خدماتنا</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            نقدم مجموعة شاملة من الخدمات لمساعدتك في الحصول على رخصة القيادة بنجاح
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-hero transition-all duration-300 transform hover:-translate-y-2 bg-card border-0 shadow-card">
              <div className="p-8">
                {/* Icon */}
                <div className={`${service.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 rtl:ml-3 rtl:mr-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <Button 
                  className="w-full shadow-button group-hover:shadow-hero transition-shadow duration-200"
                  variant="default"
                >
                  تصفح الخدمة
                  <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;