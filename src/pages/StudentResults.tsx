import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, Car, Truck, TramFront, Tractor, Bike, User } from 'lucide-react';
import { api as apiClient } from '@/integrations/api/client';
import type { LucideIcon } from 'lucide-react';

type SuccessStoryRow = {
  id: string;
  name: string;
  image_url: string | null;
  license_type: string;
  rating: number;
  review: string;
  pass_date: string;
  display_order: number;
  is_visible: boolean;
};

const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function pickLicenseIcon(licenseType: string): LucideIcon {
  const t = licenseType || '';
  if (t.includes('شاحن')) return Truck;
  if (t.includes('أجرة') || t.includes('عموم')) return TramFront;
  if (t.includes('تراكتور') || t.includes('معدات')) return Tractor;
  if (t.includes('نارية') || t.includes('دراجة')) return Bike;
  return Car;
}

function formatPassDate(passDate: string): string {
  if (!passDate) return '';
  try {
    const d = new Date(passDate);
    if (Number.isNaN(d.getTime())) return passDate;
    return d.toLocaleDateString('ar');
  } catch {
    return passDate;
  }
}

const StudentResults = () => {
  const [stories, setStories] = useState<SuccessStoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await apiClient
          .from('success_stories')
          .select('*')
          .eq('is_visible', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        if (!cancelled) {
          setStories((data || []) as SuccessStoryRow[]);
        }
      } catch {
        if (!cancelled) setStories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (stories.length === 0) return [];
    const sumRating = stories.reduce((s, x) => s + (Number(x.rating) || 0), 0);
    const avg = sumRating / stories.length;
    return [
      { label: 'قصص منشورة', value: String(stories.length), icon: Award },
      { label: 'متوسط التقييم', value: `${avg.toFixed(1)}/5`, icon: Star },
    ];
  }, [stories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">قصص نجاح ملهمة</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              نتائج <span className="text-primary">طلابنا</span> المميزة
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              استمع لتجارب طلابنا الناجحين وكيف ساعدناهم في تحقيق حلمهم بالحصول على رخصة القيادة
            </p>
          </div>

          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-elevated transition-all duration-300"
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <stat.icon className="h-12 w-12 text-primary mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {stories.length === 0 ? (
            <Card className="max-w-xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد قصص نجاح منشورة حالياً. يمكن للإدارة إضافتها من لوحة التحكم.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((student) => {
                  const LicenseIcon = pickLicenseIcon(student.license_type);
                const photoUrl = resolveImageUrl(student.image_url);
                return (
                  <Card
                    key={student.id}
                    className="group hover:shadow-elevated transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="relative mx-auto mb-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-primary p-1 mx-auto">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={student.name}
                              className="w-full h-full rounded-full bg-background object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                              <User className="h-12 w-12 text-muted-foreground" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <Award className="h-3 w-3 ml-1" />
                            ناجح
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">{student.name}</CardTitle>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <LicenseIcon className="h-4 w-4" />
                        <span className="text-sm">{student.license_type}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center gap-1" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const r = Number(student.rating) || 0;
                          const full = r >= star;
                          const half = !full && r >= star - 0.5;
                          return (
                            <span key={star} className="relative inline-block w-5 h-5">
                              <Star className={`w-5 h-5 ${full ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              {half && (
                                <span className="absolute inset-0 overflow-hidden w-1/2">
                                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                        <p className="text-sm text-muted-foreground leading-relaxed text-center">
                          &ldquo;{student.review}&rdquo;
                        </p>
                      </div>

                      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/30">
                        تاريخ النجاح: {formatPassDate(student.pass_date)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل أنت مستعد لتكون أحد قصص نجاحنا؟</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                سجّل معنا وابدأ رحلتك نحو رخصة القيادة
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                سجل الآن
                <Award className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default StudentResults;
