import { useState, useEffect } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil, Trash2, Plus, Eye, EyeOff, Car, Truck, TramFront, Bike, Tractor, Star, CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  package_name: string;
  package_name_ar: string;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  lessons_count: number | null;
  duration_hours: number | null;
  license_type: string | null;
  features: string[] | null;
  is_active: boolean;
  display_order: number;
  section_id: string | null;
  is_recommended: boolean;
  cta_label_ar: string;
  cta_href: string;
}

interface PricingAddon {
  id: string;
  title_ar: string;
  price: number;
  currency: string;
  display_order: number;
  is_active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  car: Car,
  truck: Truck,
  tram: TramFront,
  bike: Bike,
  tractor: Tractor,
};

function SectionIconPreview({ iconKey, colorClass }: { iconKey: string; colorClass: string }) {
  const Icon = ICON_MAP[iconKey] ?? Car;
  return (
    <div className={`${colorClass} p-3 rounded-xl text-white shadow-button shrink-0`}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

function countPackagesInSection(
  all: PricingPackage[],
  sectionId: string | null,
  excludePackageId?: string
): number {
  if (!sectionId) return 0;
  return all.filter(p => p.section_id === sectionId && p.id !== excludePackageId).length;
}

/** حد أقصى 3 باقات لكل قسم */
const MAX_PACKAGES_PER_SECTION = 3;

/* ─── Helpers ────────────────────────────────────────────────────────── */

function parseFeatures(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as unknown as string) as string[]; } catch { return []; }
}

function parseNotes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

/* ═══════════════════════════════════════════════════════════════════════
   Sections Tab
══════════════════════════════════════════════════════════════════════ */

function SectionsTab({
  sections,
  onRefresh,
  onOpenPackagesForSection,
}: {
  sections: PricingSection[];
  onRefresh: () => void;
  onOpenPackagesForSection: (sectionId: string) => void;
}) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingSection | null>(null);
  const [form, setForm] = useState({ show_popular_badge: false, display_order: '0' });

  const openEdit = (s: PricingSection) => {
    setEditing(s);
    setForm({ show_popular_badge: s.show_popular_badge, display_order: String(s.display_order) });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      display_order: parseInt(form.display_order) || 0,
      show_popular_badge: form.show_popular_badge,
    };
    try {
      const { error } = await apiClient.from('pricing_sections').update(payload).eq('id', editing.id);
      if (error) throw error;
      toast({ title: 'تم التحديث' });
      setIsDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (s: PricingSection) => {
    try {
      const { error } = await apiClient.from('pricing_sections').update({ is_active: !s.is_active }).eq('id', s.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>أقسام الرخص</CardTitle>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">لا توجد أقسام بعد — أضف رخصة من «الرخص» لتظهر هنا تلقائياً</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map(s => (
              <Card
                key={s.id}
                className={`relative overflow-hidden border-2 ${
                  s.is_active ? 'border-border/50' : 'border-muted opacity-80'
                } bg-card/80 backdrop-blur-sm`}
              >
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <SectionIconPreview iconKey={s.icon_key} colorClass={s.color_class} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <CardTitle className="text-lg leading-tight flex flex-wrap items-center gap-2">
                      <span>{s.title_ar}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">ترتيب العرض: {s.display_order}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {s.show_popular_badge && (
                        <Badge className="bg-yellow-500 text-white border-0 text-xs">
                          <Star className="h-3 w-3 ml-1 fill-white" />
                          الأكثر طلباً
                        </Badge>
                      )}
                      <Badge variant={s.is_active ? 'default' : 'secondary'}>
                        {s.is_active ? 'نشط' : 'مخفي'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(s)}>
                    {s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenPackagesForSection(s.id)}>
                    الباقات
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* حوار تعديل الترتيب وشارة الأكثر طلباً فقط */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل: {editing?.title_ar}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            الاسم والأيقونة واللون تُحدَّث تلقائياً من «الرخص».
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={e => setForm({ ...form, display_order: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.show_popular_badge}
                onCheckedChange={v => setForm({ ...form, show_popular_badge: v })}
              />
              <Label>شارة «الأكثر طلباً»</Label>
            </div>
            <DialogFooter>
              <Button type="submit">تحديث</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Packages Tab
══════════════════════════════════════════════════════════════════════ */

function PackagesTab({
  packages,
  sections,
  onRefresh,
  focusSectionId,
}: {
  packages: PricingPackage[];
  sections: PricingSection[];
  onRefresh: () => void;
  focusSectionId: string | null;
}) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPackage | null>(null);
  const [features, setFeatures] = useState<string[]>(['']);
  const [form, setForm] = useState({
    package_name_ar: '',
    price: '',
    lessons_count: '',
    duration_hours: '',
    is_recommended: false,
    display_order: '1',
  });

  const clampOrder = (v: number) => String(Math.min(3, Math.max(1, v || 1)));

  const resetForm = () => {
    setForm({
      package_name_ar: '',
      price: '',
      lessons_count: '',
      duration_hours: '',
      is_recommended: false,
      display_order: '1',
    });
    setFeatures(['']);
  };

  const openAdd = () => {
    resetForm();
    setEditing(null);
    setIsDialogOpen(true);
  };
  const openEdit = (p: PricingPackage) => {
    setEditing(p);
    setForm({
      package_name_ar: p.package_name_ar,
      price: String(p.price),
      lessons_count: p.lessons_count != null ? String(p.lessons_count) : '',
      duration_hours: p.duration_hours != null ? String(p.duration_hours) : '',
      is_recommended: p.is_recommended,
      display_order: clampOrder(p.display_order),
    });
    setFeatures(parseFeatures(p.features).length > 0 ? parseFeatures(p.features) : ['']);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = focusSectionId || editing?.section_id || null;
    if (!sid) {
      toast({
        title: 'خطأ',
        description: 'لم يُحدد قسم الرخصة. ارجع إلى أقسام الرخص وافتح الباقات من القسم المطلوب.',
        variant: 'destructive',
      });
      return;
    }
    const othersInSection = countPackagesInSection(packages, sid, editing?.id);
    if (othersInSection >= MAX_PACKAGES_PER_SECTION) {
      toast({
        title: 'غير مسموح',
        description: `لا يمكن أن يتجاوز عدد الباقات في القسم ${MAX_PACKAGES_PER_SECTION}. احذف أو انقل باقة قبل الإضافة.`,
        variant: 'destructive',
      });
      return;
    }
    const package_name = editing?.package_name ?? `pkg_${crypto.randomUUID()}`;
    const payload = {
      package_name,
      package_name_ar: form.package_name_ar,
      price: parseFloat(form.price),
      currency: 'ILS',
      lessons_count: form.lessons_count ? parseInt(form.lessons_count) : null,
      duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
      display_order: parseInt(form.display_order) || 1,
      section_id: sid,
      is_recommended: form.is_recommended,
      cta_label_ar: 'تواصل معنا',
      cta_href: '/contact',
      features: features.filter(f => f.trim() !== ''),
    };
    try {
      if (editing) {
        const { error } = await apiClient.from('pricing').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'تم التحديث' });
      } else {
        const { error } = await apiClient.from('pricing').insert([{ ...payload, is_active: true }]);
        if (error) throw error;
        toast({ title: 'تمت الإضافة' });
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (p: PricingPackage) => {
    try {
      const { error } = await apiClient.from('pricing').update({ is_active: !p.is_active }).eq('id', p.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      const { error } = await apiClient.from('pricing').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const sectionMap = Object.fromEntries(sections.map(s => [s.id, s.title_ar]));
  const focusSectionTitle = focusSectionId ? sectionMap[focusSectionId] : null;
  const packagesToShow = focusSectionId
    ? packages.filter(p => p.section_id === focusSectionId)
    : packages;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>الباقات</CardTitle>
            <CardDescription>
              {focusSectionTitle
                ? (
                  <>
                    باقات قسم «{focusSectionTitle}» — حد أقصى {MAX_PACKAGES_PER_SECTION} باقات لهذا القسم
                  </>
                )
                : `إدارة باقات التدريب ومميزاتها — حد أقصى ${MAX_PACKAGES_PER_SECTION} باقات لكل قسم`}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={openAdd}><Plus className="ml-2 h-4 w-4" />إضافة باقة</Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'تعديل باقة' : 'إضافة باقة جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>اسم الباقة (عربي)</Label>
                  <Input value={form.package_name_ar} onChange={e => setForm({ ...form, package_name_ar: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>السعر</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>ترتيب العرض</Label>
                    <Select value={form.display_order} onValueChange={v => setForm({ ...form, display_order: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>عدد الدروس</Label>
                    <Input type="number" value={form.lessons_count} onChange={e => setForm({ ...form, lessons_count: e.target.value })} />
                  </div>
                  <div>
                    <Label>عدد الساعات</Label>
                    <Input type="number" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>المميزات</Label>
                  <div className="space-y-2 mt-1">
                    {features.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={f}
                          placeholder={`ميزة ${i + 1}`}
                          onChange={e => {
                            const next = [...features];
                            next[i] = e.target.value;
                            setFeatures(next);
                          }}
                        />
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setFeatures([...features, ''])}>
                      <Plus className="ml-1 h-4 w-4" />إضافة ميزة
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_recommended}
                    onCheckedChange={v => setForm({ ...form, is_recommended: v })}
                  />
                  <Label>موصى بها «الأكثر اختياراً»</Label>
                </div>

                <DialogFooter>
                  <Button type="submit">{editing ? 'تحديث' : 'إضافة'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {packagesToShow.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {focusSectionId ? 'لا توجد باقات لهذا القسم بعد' : 'لا توجد باقات بعد'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...packagesToShow].sort((a, b) => a.display_order - b.display_order || a.package_name_ar.localeCompare(b.package_name_ar)).map(p => {
              const feats = parseFeatures(p.features);
              const preview = feats.slice(0, 4);
              const more = feats.length > 4;
              return (
                <Card
                  key={p.id}
                  className={`relative overflow-hidden border-2 ${
                    p.is_recommended ? 'border-primary shadow-elevated' : 'border-border/50'
                  } ${p.is_active ? '' : 'opacity-75'} bg-card/80 backdrop-blur-sm`}
                >
                  {p.is_recommended && (
                    <div className="absolute top-0 left-0 right-0 z-10">
                      <div className="bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
                        الأكثر اختياراً (معاينة)
                      </div>
                    </div>
                  )}
                  <CardHeader className={p.is_recommended ? 'pt-12' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg leading-tight">{p.package_name_ar}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {p.section_id ? sectionMap[p.section_id] || '—' : 'بدون قسم'}
                          {' · '}
                          ترتيب {p.display_order}
                        </p>
                      </div>
                      <Badge variant={p.is_active ? 'default' : 'secondary'} className="shrink-0">
                        {p.is_active ? 'نشط' : 'مخفي'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-center gap-1 pt-2">
                      <span className="text-3xl font-bold text-primary">{p.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">{siteCurrencyLabel(p.currency)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feats.length > 0 ? (
                      <ul className="space-y-2">
                        {preview.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {more && (
                          <li className="text-xs text-muted-foreground pr-6">+{feats.length - 4} ميزات أخرى…</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">لا مميزات بعد</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>
                        {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deletePackage(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Addons Tab
══════════════════════════════════════════════════════════════════════ */

function AddonsTab({ addons, onRefresh }: { addons: PricingAddon[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingAddon | null>(null);
  const [form, setForm] = useState({ title_ar: '', price: '', currency: 'ILS', display_order: '0' });

  const resetForm = () => setForm({ title_ar: '', price: '', currency: 'ILS', display_order: '0' });
  const openAdd = () => { resetForm(); setEditing(null); setIsDialogOpen(true); };
  const openEdit = (a: PricingAddon) => {
    setEditing(a);
    setForm({ title_ar: a.title_ar, price: String(a.price), currency: a.currency, display_order: String(a.display_order) });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), display_order: parseInt(form.display_order) || 0 };
    try {
      if (editing) {
        const { error } = await apiClient.from('pricing_addons').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'تم التحديث' });
      } else {
        const { error } = await apiClient.from('pricing_addons').insert([{ ...payload, is_active: true }]);
        if (error) throw error;
        toast({ title: 'تمت الإضافة' });
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (a: PricingAddon) => {
    try {
      const { error } = await apiClient.from('pricing_addons').update({ is_active: !a.is_active }).eq('id', a.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const deleteAddon = async (id: string) => {
    if (!confirm('حذف هذه الخدمة الإضافية؟')) return;
    try {
      const { error } = await apiClient.from('pricing_addons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>الخدمات الإضافية</CardTitle>
            <CardDescription>خدمات اختيارية تُعرض في أسفل صفحة الأسعار</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={openAdd}><Plus className="ml-2 h-4 w-4" />إضافة خدمة</Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'تعديل خدمة' : 'إضافة خدمة إضافية'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>اسم الخدمة</Label>
                  <Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>السعر</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>العملة</Label>
                    <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} />
                  </div>
                  <div>
                    <Label>الترتيب</Label>
                    <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editing ? 'تحديث' : 'إضافة'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {addons.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">لا توجد خدمات إضافية بعد</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الترتيب</TableHead>
                <TableHead className="text-right">اسم الخدمة</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground">{a.display_order}</TableCell>
                  <TableCell className="font-medium">{a.title_ar}</TableCell>
                  <TableCell>{a.price.toLocaleString()} {siteCurrencyLabel(a.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'نشط' : 'مخفي'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(a)}>
                        {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteAddon(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Notes Tab
══════════════════════════════════════════════════════════════════════ */

function NotesTab() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await apiClient
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'pricing_important_notes')
        .maybeSingle();
      if (error) throw error;
      setNotes(parseNotes((data as any)?.setting_value));
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await apiClient
        .from('site_settings')
        .update({ setting_value: JSON.stringify(notes.filter(n => n.trim())) })
        .eq('setting_key', 'pricing_important_notes');
      if (error) throw error;
      toast({ title: 'تم الحفظ', description: 'تم حفظ الملاحظات بنجاح' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  if (isLoading) return (
    <Card><CardContent className="py-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>الملاحظات المهمة</CardTitle>
        <CardDescription>تظهر في أسفل صفحة الأسعار — كل سطر ملاحظة مستقلة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={note}
              placeholder={`ملاحظة ${i + 1}`}
              onChange={e => {
                const next = [...notes];
                next[i] = e.target.value;
                setNotes(next);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => setNotes(notes.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setNotes([...notes, ''])}>
            <Plus className="ml-1 h-4 w-4" />إضافة ملاحظة
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Root Component
══════════════════════════════════════════════════════════════════════ */

type PricingTab = 'sections' | 'packages' | 'addons' | 'notes';

export const AdminPricing = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<PricingSection[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PricingTab>('sections');
  const [packagesSectionId, setPackagesSectionId] = useState<string | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    const warnings: string[] = [];

    const secRes = await apiClient
      .from('pricing_sections')
      .select('*')
      .order('display_order', { ascending: true });
    if (secRes.error) warnings.push(`أقسام الرخص: ${secRes.error.message}`);
    setSections(((secRes.data || []) as PricingSection[]) ?? []);

    const pkgRes = await apiClient.from('pricing').select('*').order('display_order', { ascending: true });
    if (pkgRes.error) warnings.push(`الباقات: ${pkgRes.error.message}`);
    setPackages(((pkgRes.data || []) as PricingPackage[]) ?? []);

    const addRes = await apiClient.from('pricing_addons').select('*').order('display_order', { ascending: true });
    if (addRes.error) warnings.push(`الخدمات الإضافية: ${addRes.error.message}`);
    setAddons(((addRes.data || []) as PricingAddon[]) ?? []);

    if (warnings.length > 0) {
      toast({
        title: warnings.length >= 3 ? 'فشل تحميل البيانات' : 'تحميل جزئي',
        description: `${warnings.join(' — ')}. إن ظهر «relation» أو «does not exist» شغّل: node backend/src/scripts/init-db.js`,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleTabChange = (v: string) => {
    const next = v as PricingTab;
    setActiveTab(next);
    if (next !== 'packages') setPackagesSectionId(null);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
      <TabsList className="mb-6">
        <TabsTrigger value="sections">أقسام الرخص</TabsTrigger>
        <TabsTrigger value="addons">الخدمات الإضافية</TabsTrigger>
        <TabsTrigger value="notes">الملاحظات المهمة</TabsTrigger>
      </TabsList>
      <TabsContent value="sections">
        <SectionsTab
          sections={sections}
          onRefresh={fetchAll}
          onOpenPackagesForSection={id => {
            setPackagesSectionId(id);
            setActiveTab('packages');
          }}
        />
      </TabsContent>
      <TabsContent value="packages">
        <PackagesTab
          packages={packages}
          sections={sections}
          onRefresh={fetchAll}
          focusSectionId={packagesSectionId}
        />
      </TabsContent>
      <TabsContent value="addons">
        <AddonsTab addons={addons} onRefresh={fetchAll} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesTab />
      </TabsContent>
    </Tabs>
  );
};
