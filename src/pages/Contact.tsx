import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageSquare,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم إرسال رسالتك بنجاح!",
      description: "سنتواصل معك في أقرب وقت ممكن",
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'الهاتف',
      details: ['022-291-542', '0599-210-071'],
      color: 'text-primary'
    },
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      details: ['info@almadena-academy.com', 'support@almadena-academy.com'],
      color: 'text-blue-600'
    },
    {
      icon: MapPin,
      title: 'العنوان',
      details: ['مقابل دوار الجداول، خلف مجمع الجليل', 'مدينة الخليل - فلسطين'],
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      details: ['السبت - الخميس: 8:00 صباحاً - 7:00 مساءً', 'الجمعة: مغلق'],
      color: 'text-orange-600'
    }
  ];

  const socialMedia = [
    { icon: Facebook, name: 'Facebook', url: '#', color: 'hover:text-blue-600' },
    { icon: Instagram, name: 'Instagram', url: '#', color: 'hover:text-pink-600' },
    { icon: Youtube, name: 'YouTube', url: '#', color: 'hover:text-red-600' }
  ];

  const features = [
    'رد سريع على استفساراتك',
    'دعم فني متاح طوال الأسبوع',
    'استشارات مجانية',
    'متابعة مستمرة'
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              نحن هنا لخدمتك
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              تواصل معنا
            </h1>
            <p className="text-xl text-white/90 mb-8">
              نسعد بالرد على جميع استفساراتك ومساعدتك في رحلتك لتعلم القيادة
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 rounded-xl bg-gradient-card mb-4 w-fit">
                    <info.icon className={`h-8 w-8 ${info.color}`} />
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {detail}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-lg bg-gradient-primary">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>
                    <CardDescription>املأ النموذج وسنتواصل معك قريباً</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right block">الاسم الكامل *</Label>
                    <Input
                      id="name"
                      placeholder="أدخل اسمك الكامل"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-right block">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-right block">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="05xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-right block">الموضوع *</Label>
                    <Input
                      id="subject"
                      placeholder="موضوع رسالتك"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-right block">الرسالة *</Label>
                    <Textarea
                      id="message"
                      placeholder="اكتب رسالتك هنا..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="text-right resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Send className="ml-2 h-5 w-5" />
                    <span>إرسال الرسالة</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map and Additional Info */}
            <div className="space-y-6">
              {/* Map Placeholder */}
              <Card className="border-2 border-primary/20 overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="aspect-video bg-gradient-card flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                  <div className="text-center z-10">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-bold text-foreground">موقعنا على الخريطة</p>
                    <p className="text-sm text-muted-foreground">مقابل دوار الجداول، الخليل</p>
                  </div>
                </div>
              </Card>

              {/* Why Contact Us */}
              <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-right">لماذا تتواصل معنا؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">للحصول على استشارة مجانية حول برامجنا التدريبية</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">لحجز موعد لدرس تجريبي مجاني</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">للاستفسار عن الأسعار والعروض الخاصة</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">لحل أي مشكلة تقنية في الموقع</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">للشكاوى والاقتراحات لتحسين خدماتنا</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-right">تابعنا على</CardTitle>
                  <CardDescription className="text-right">
                    ابقَ على اطلاع بآخر الأخبار والعروض
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 justify-center">
                    {socialMedia.map((social, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="lg"
                        className={`transition-all duration-300 ${social.color}`}
                        asChild
                      >
                        <a href={social.url} target="_blank" rel="noopener noreferrer">
                          <social.icon className="h-6 w-6" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-card border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">أسئلة شائعة</h2>
              <p className="text-muted-foreground">ربما تجد إجابة سؤالك هنا</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'ما هي ساعات العمل؟',
                  a: 'نعمل من السبت إلى الخميس من 8:00 صباحاً حتى 7:00 مساءً'
                },
                {
                  q: 'كم يستغرق الرد على الرسائل؟',
                  a: 'نحاول الرد على جميع الرسائل خلال 24 ساعة كحد أقصى'
                },
                {
                  q: 'هل يمكن حجز موعد عبر الموقع؟',
                  a: 'نعم، يمكنك حجز موعد من خلال لوحة التحكم أو الاتصال بنا مباشرة'
                },
                {
                  q: 'هل تقدمون دروس في عطلة نهاية الأسبوع؟',
                  a: 'نعم، نقدم دروس في أيام السبت والأحد حسب التوفر'
                }
              ].map((faq, index) => (
                <Card key={index} className="border-2 hover:border-primary/30 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-right">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-right">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;