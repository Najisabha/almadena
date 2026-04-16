import { Car, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { loadPublicContactSettings } from '@/lib/loadPublicContactSettings';

const Footer = () => {
  const [contactSettings, setContactSettings] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await loadPublicContactSettings();
      if (!cancelled) setContactSettings(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickLinks = [
    { title: 'الرئيسية', href: '/' },
    { title: 'أسئلة التووريا والامتحانات', href: '/questions' },
    { title: 'نتائج الطلاب', href: '/student-results' },
    { title: 'اتصل بنا', href: '/contact' },
  ];

  const licenseTypes = [
    { title: 'رخصة عمومية', href: '/license/public' },
    { title: 'رخصة خصوصية', href: '/license/private' },
    { title: 'رخصة تراكتور', href: '/license/tractor' },
    { title: 'رخصة دراجة نارية', href: '/license/motorcycle' },
  ];

  const hasContactBlock =
    !!contactSettings.site_phone ||
    !!contactSettings.site_email ||
    !!contactSettings.site_address ||
    !!contactSettings.whatsapp_number;

  return (
    <footer className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              {contactSettings.facebook_url ? (
                <Button size="sm" variant="secondary" className="p-2" asChild>
                  <a href={contactSettings.facebook_url} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              {contactSettings.instagram_url ? (
                <Button size="sm" variant="secondary" className="p-2" asChild>
                  <a href={contactSettings.instagram_url} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold">روابط سريعة</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold">أنواع الرخص</h4>
            <ul className="space-y-3">
              {licenseTypes.map((license, index) => (
                <li key={index}>
                  <a
                    href={license.href}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                  >
                    {license.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold">معلومات التواصل</h4>
            {hasContactBlock ? (
              <div className="space-y-4">
                {contactSettings.site_phone ? (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Phone className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-primary-foreground/90">{contactSettings.site_phone}</span>
                  </div>
                ) : null}
                {contactSettings.whatsapp_number ? (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Phone className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-primary-foreground/90" dir="ltr">
                      واتساب: {contactSettings.whatsapp_number}
                    </span>
                  </div>
                ) : null}
                {contactSettings.site_email ? (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Mail className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-primary-foreground/90 break-all">{contactSettings.site_email}</span>
                  </div>
                ) : null}
                {contactSettings.site_address ? (
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <MapPin className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">{contactSettings.site_address}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-primary-foreground/70">
                لم تُضبط معلومات التواصل بعد. يمكن إضافتها من لوحة الإدارة.
              </p>
            )}

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

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-primary-foreground/70">
            © {new Date().getFullYear()} أكاديمية المدينة لتعليم القيادة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
