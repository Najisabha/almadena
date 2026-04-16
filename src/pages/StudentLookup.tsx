import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentLookup = () => {
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    if (!idNumber) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال رقم الهوية',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: 'الاستعلام غير متاح حالياً',
      description:
        'عرض النتائج عبر الموقع العام غير مفعّل. يمكنك الاطلاع على نتائجك من لوحة الطالب بعد تسجيل الدخول عند توفر الخدمة.',
      variant: 'destructive',
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              استعلام سريع وآمن
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              الاستعلام عن <span className="text-primary">نتائج الطلاب</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تحقق من نتائجك في التووريا والفحص العملي باستخدام رقم الهوية الوطنية
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm shadow-elevated">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                <span>ابحث عن نتائجك</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-right block">
                    رقم الهوية الوطنية
                  </Label>
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder="أدخل رقم الهوية الوطنية (10 أرقام)"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    maxLength={10}
                    className="text-center text-lg"
                    dir="ltr"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary shadow-button"
                  size="lg"
                >
                  {isLoading ? (
                    'جاري البحث...'
                  ) : (
                    <>
                      <Search className="ml-2 h-5 w-5" />
                      بحث عن النتائج
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center">معلومات مهمة</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>يتم تحديث النتائج فوراً بعد الامتحان</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>في حالة الرسوب، يمكن إعادة الامتحان بعد 7 أيام</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>للاستفسارات، تواصل معنا عبر صفحة الاتصال</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default StudentLookup;
