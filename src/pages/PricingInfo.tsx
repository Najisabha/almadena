import { useEffect, useState } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car, Truck, TramFront, Bike, Tractor, CheckCircle2, Star, Phone, BookOpen, Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteCurrencyLabel } from '@/lib/siteCurrency';

/* ─── Types ─────────────────────────────────────────────────────────── */

interface PricingSection {
  id: string;
  title_ar: string;
  icon_key: string;
  color_class: string;
  show_popular_badge: boolean;
  display_order: number;
  is_active: boolean;
  license_id?: string | null;
}

interface PricingPackage {
  id: string;
  package_name_ar: string;
  price: number;
  currency: string;
  features: string[] | null;
  is_active: boolean;
  display_order: number;
  section_id: string | null;
  is_recommended: boolean;
  cta_label_ar: string;
  cta_href: string;
  lessons_count: number | null;
  duration_hours: number | null;
}

interface PricingAddon {
  id: string;
  title_ar: string;
  price: number;
  currency: string;
  display_order: number;
  is_active: boolean;
}

/* ─── Icon map ───────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ElementType> = {
  car: Car,
  truck: Truck,
  tram: TramFront,
  bike: Bike,
  tractor: Tractor,
};

function SectionIcon({ iconKey, colorClass }: { iconKey: string; colorClass: string }) {
  const Icon = ICON_MAP[iconKey] ?? Car;
  return (
    <div className={`${colorClass} p-3 rounded-xl text-white shadow-button`}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

function parseFeatures(raw: string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as unknown as string) as string[]; } catch { return []; }
}

function parseNotes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string' && n.trim() !== '') : [];
  } catch {
    return [];
  }
}

/* ─── Component ──────────────────────────────────────────────────────── */

const PricingInfo = () => {
  const [sections, setSections] = useState<PricingSection[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [secRes, pkgRes, addRes, notesRes] = await Promise.all([
          apiClient
            .from('pricing_sections')
            .select('*')
            .order('display_order', { ascending: true }),
          apiClient
            .from('pricing')
            .select('*')
            .order('display_order', { ascending: true }),
          apiClient
            .from('pricing_addons')
            .select('*')
            .order('display_order', { ascending: true }),
          apiClient
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'pricing_important_notes')
            .maybeSingle(),
        ]);

        setSections(((secRes.data || []) as PricingSection[]).filter(s => s.is_active));
        setPackages(((pkgRes.data || []) as PricingPackage[]).filter(p => p.is_active));
        setAddons(((addRes.data || []) as PricingAddon[]).filter(a => a.is_active));
        setNotes(parseNotes((notesRes.data as any)?.setting_value));
      } catch {
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
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
            {sections.map(section => {
              const sectionPkgs = packages
                .filter(p => p.section_id === section.id)
                .sort((a, b) => a.display_order - b.display_order || a.package_name_ar.localeCompare(b.package_name_ar))
                .slice(0, 3);
              if (sectionPkgs.length === 0) return null;
              return (
                <div key={section.id}>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <SectionIcon iconKey={section.icon_key} colorClass={section.color_class} />
                    <h2 className="text-3xl font-bold text-foreground flex flex-wrap items-center justify-center gap-2">
                      <span>{section.title_ar}</span>
                    </h2>
                    {section.show_popular_badge && (
                      <Badge className="bg-yellow-500 text-white border-0">
                        <Star className="h-3 w-3 ml-1 fill-white" />
                        الأكثر طلباً
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sectionPkgs.map(pkg => (
                      <Card
                        key={pkg.id}
                        className={`relative overflow-hidden border-2 ${
                          pkg.is_recommended
                            ? 'border-primary shadow-elevated scale-105'
                            : 'border-border/50'
                        } bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300`}
                      >
                        {pkg.is_recommended && (
                          <div className="absolute top-0 left-0 right-0">
                            <div className="bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
                              الأكثر اختياراً ⭐
                            </div>
                          </div>
                        )}

                        <CardHeader className={pkg.is_recommended ? 'pt-12' : ''}>
                          <CardTitle className="text-center">
                            <div className="text-xl font-bold text-foreground mb-2">{pkg.package_name_ar}</div>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold text-primary">
                                {pkg.price.toLocaleString()}
                              </span>
                              <span className="text-muted-foreground">{siteCurrencyLabel(pkg.currency)}</span>
                            </div>
                            {(pkg.lessons_count != null && pkg.lessons_count > 0)
                            || (pkg.duration_hours != null && pkg.duration_hours > 0) ? (
                              <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {pkg.lessons_count != null && pkg.lessons_count > 0 ? (
                                  <div
                                    className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                                  >
                                    <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden />
                                    <span>
                                      {pkg.lessons_count.toLocaleString()}
                                      {' '}
                                      {pkg.lessons_count === 1 ? 'درس' : 'دروس'}
                                    </span>
                                  </div>
                                ) : null}
                                {pkg.duration_hours != null && pkg.duration_hours > 0 ? (
                                  <div
                                    className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                                  >
                                    <Clock className="h-4 w-4 text-primary shrink-0" aria-hidden />
                                    <span>
                                      {pkg.duration_hours.toLocaleString()}
                                      {' '}
                                      {pkg.duration_hours === 1 ? 'ساعة' : 'ساعات'}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <ul className="space-y-3">
                            {parseFeatures(pkg.features).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            className={`w-full ${pkg.is_recommended ? 'bg-gradient-primary shadow-button' : ''}`}
                            asChild
                          >
                            <Link to="/contact">تواصل معنا</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      {addons.length > 0 && (
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
                    {addons.map(addon => (
                      <li
                        key={addon.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/30"
                      >
                        <span className="text-foreground font-medium">{addon.title_ar}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-primary">
                            {addon.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">{siteCurrencyLabel(addon.currency)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {notes.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-center">ملاحظات مهمة</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  {notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل لديك استفسار عن الأسعار؟</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                تواصل معنا للحصول على استشارة مجانية واختيار الباقة المناسبة لك
              </p>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
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
