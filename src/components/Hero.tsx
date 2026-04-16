import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Users, Award, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-bg-modern.jpg';

const Hero = () => {
  const features = [
    { icon: Users, title: 'تعليم مرن', description: 'أسئلة وامتحانات تجريبية حسب نوع الرخصة' },
    { icon: Award, title: 'متابعة التقدم', description: 'تتبع نتائجك وامتحاناتك من لوحة الطالب' },
    { icon: BookOpen, title: 'منهج منظم', description: 'أسئلة وامتحانات تجريبية لاستعدادك للتووريا' },
  ];

  const quickLinks = [
    { title: 'أسئلة التووريا والامتحانات', href: '/questions', color: 'bg-primary' },
    { title: 'إشارات المرور', href: '/signs', color: 'bg-accent' },
    { title: 'نتائج الطلاب', href: '/student-results', color: 'bg-success' },
  ];

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Hero Background */}
      <div 
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero/95"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative container mx-auto px-4 pt-32 pb-20">
          <div className="text-center text-white mb-20">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
              <CheckCircle className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">الأكاديمية الرائدة في تعليم القيادة</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              أكاديمية <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">المدينة</span>
            </h1>
            <p className="text-2xl md:text-3xl mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              طريقك إلى <span className="font-bold text-primary">النجاح</span> في تعلم القيادة الآمنة والاحترافية
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button size="lg" className="shadow-elevated hover:shadow-hero transition-all duration-500 text-xl px-12 py-8 rounded-2xl group" asChild>
                <Link to="/auth">
                  <span>ابدأ رحلتك الآن</span>
                  <ArrowLeft className="mr-3 h-6 w-6 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 text-xl px-12 py-8 rounded-2xl" asChild>
                <Link to="/dashboard">شاهد النتائج</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/20 p-8 text-center text-white shadow-elevated hover:shadow-hero transition-all duration-500 hover:-translate-y-2 group">
                <div className="bg-primary/20 p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:bg-primary/30 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-primary mx-auto" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/90 text-lg leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} to={link.href}>
                <Card className="bg-white/90 backdrop-blur-md shadow-elevated hover:shadow-hero transition-all duration-500 cursor-pointer group hover:-translate-y-3 border-0">
                  <div className="p-8 text-center">
                    <div className={`w-6 h-6 ${link.color} rounded-xl mx-auto mb-4 group-hover:scale-125 transition-transform duration-300`}></div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors duration-300 text-lg">
                      {link.title}
                    </h4>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-card py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">قصص النجاح</h2>
            <p className="text-xl text-muted-foreground mb-10">
              اطّلع على تجارب الخريجين المنشورة من قبل الأكاديمية من صفحة نتائج الطلاب.
            </p>
            <Button size="lg" className="shadow-elevated" asChild>
              <Link to="/student-results">عرض نتائج الطلاب</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;