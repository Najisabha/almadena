import { Car, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const quickLinks = [
    { title: 'الرئيسية', href: '/' },
    { title: 'أسئلة التووري', href: '/questions' },
    { title: 'الامتحانات', href: '/exams' },
    { title: 'دراسة التووري', href: '/study' },
    { title: 'النتائج', href: '/results' },
    { title: 'اتصل بنا', href: '/contact' }
  ];

  const licenseTypes = [
    { title: 'رخصة عمومية', href: '/license/public' },
    { title: 'رخصة خصوصية', href: '/license/private' },
    { title: 'رخصة تراكتور', href: '/license/tractor' },
    { title: 'رخصة دراجة نارية', href: '/license/motorcycle' }
  ];

  return (
    <footer className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="bg-secondary p-2 rounded-lg">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">أكاديمية المدينة</h3>
                <p className="text-sm text-primary-foreground/80">لتعليم القيادة</p>
              </div>
            </div>
            <p className="text-primary-foreground/90 leading-relaxed">
              أكاديمية متخصصة في تعليم القيادة بأحدث الطرق والأساليب العلمية مع نخبة من أفضل المدربين المحترفين.
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <Button size="sm" variant="secondary" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">روابط سريعة</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* License Types */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">أنواع الرخص</h4>
            <ul className="space-y-3">
              {licenseTypes.map((license, index) => (
                <li key={index}>
                  <a href={license.href} className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200">
                    {license.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">معلومات التواصل</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Phone className="h-5 w-5 text-secondary" />
                <span className="text-primary-foreground/90">+962 79 123 4567</span>
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Mail className="h-5 w-5 text-secondary" />
                <span className="text-primary-foreground/90">info@almadina-academy.com</span>
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <MapPin className="h-5 w-5 text-secondary" />
                <span className="text-primary-foreground/90">عمان، الأردن - شارع الملك حسين</span>
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Clock className="h-5 w-5 text-secondary" />
                <span className="text-primary-foreground/90">السبت - الخميس: 8:00 ص - 8:00 م</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-4">
              <h5 className="font-semibold mb-3">اشترك في النشرة الإخبارية</h5>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Input 
                  placeholder="بريدك الإلكتروني" 
                  className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
                />
                <Button variant="secondary" size="sm">
                  اشتراك
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-primary-foreground/70">
            © 2024 أكاديمية المدينة لتعليم القيادة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;