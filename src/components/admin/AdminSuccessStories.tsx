import { useState, useEffect, useRef, useMemo } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import type { AdminStudent } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, Star, Upload, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SuccessStory {
  id: string;
  name: string;
  image_url: string | null;
  license_type: string;
  rating: number;
  review: string;
  pass_date: string;
  is_visible: boolean;
  display_order: number;
}

type LicenseRow = {
  id: string;
  code: string;
  name_ar: string;
  is_active?: boolean;
  display_order?: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FALLBACK_LICENSES: LicenseRow[] = [
  { id: 'fallback-B', code: 'B', name_ar: 'خصوصي', is_active: true, display_order: 1 },
  { id: 'fallback-C1', code: 'C1', name_ar: 'شحن خفيف', is_active: true, display_order: 2 },
  { id: 'fallback-C', code: 'C', name_ar: 'شحن ثقيل', is_active: true, display_order: 3 },
  { id: 'fallback-D1', code: 'D1', name_ar: 'عمومي', is_active: true, display_order: 4 },
  { id: 'fallback-A', code: 'A', name_ar: 'دراجة نارية', is_active: true, display_order: 5 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function mapProfileLicenseToCode(raw: string | null | undefined, licenses: LicenseRow[]): string {
  if (!raw || !String(raw).trim()) return '';
  const t = String(raw).trim();
  if (licenses.some((l) => l.code === t)) return t;
  const m = t.match(/\(([A-Z0-9]+)\)\s*$/i);
  if (m) {
    const c = m[1].toUpperCase();
    if (licenses.some((l) => l.code === c)) return c;
  }
  const byName = licenses.find((l) => t === l.name_ar || t.startsWith(`${l.name_ar} `));
  if (byName) return byName.code;
  return t;
}

function formatLicenseDisplay(raw: string | null | undefined, pool: LicenseRow[]): string {
  if (!raw) return '';
  const list = pool.length > 0 ? pool : FALLBACK_LICENSES;
  const code = mapProfileLicenseToCode(raw, list);
  const row = list.find((l) => l.code === code);
  if (row) return `${row.name_ar} (${row.code})`;
  return raw;
}

function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** تجزئة YYYY-MM-DD إلى ثلاثة أجزاء */
function splitPassDate(passDate: string): { y: string; m: string; d: string } {
  if (!passDate) return { y: '', m: '', d: '' };
  try {
    const parts = passDate.split('T')[0].split('-');
    return { y: parts[0] || '', m: parts[1]?.replace(/^0/, '') || '', d: parts[2]?.replace(/^0/, '') || '' };
  } catch {
    return { y: '', m: '', d: '' };
  }
}

/** دمج الثلاثة أجزاء إلى YYYY-MM-DD أو null */
function buildPassDate(y: string, m: string, d: string): string | null {
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  const di = parseInt(d, 10);
  if (!yi || !mi || !di) return null;
  if (mi < 1 || mi > 12) return null;
  const maxDay = daysInMonth(yi, mi);
  const safeDay = Math.min(di, maxDay);
  return `${yi}-${String(mi).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

// ─── StarRating component ──────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const fullFill = display >= star;
        const halfFill = !fullFill && display >= star - 0.5;
        return (
          <div key={star} className="relative w-7 h-7 cursor-pointer">
            {/* نصف يسار */}
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(star - 0.5)}
              aria-label={`${star - 0.5} نجوم`}
            />
            {/* نصف يمين */}
            <button
              type="button"
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(star)}
              aria-label={`${star} نجوم`}
            />
            <Star
              className={`w-7 h-7 pointer-events-none ${
                fullFill
                  ? 'fill-yellow-400 text-yellow-400'
                  : halfFill
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              style={halfFill ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
            />
            {halfFill && (
              <Star className="w-7 h-7 pointer-events-none absolute inset-0 text-gray-300" />
            )}
          </div>
        );
      })}
      <span className="mr-2 text-sm text-muted-foreground self-center">{display}/5</span>
    </div>
  );
}

/** عرض نجوم القراءة فقط مع دعم النصف */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = rating >= star;
        const half = !full && rating >= star - 0.5;
        return (
          <span key={star} className="relative inline-block w-4 h-4">
            <Star className={`w-4 h-4 ${full ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            {half && (
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export const AdminSuccessStories = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const { toast } = useToast();

  // Students & licenses for the picker
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState('');
  const [passY, setPassY] = useState('');
  const [passM, setPassM] = useState('');
  const [passD, setPassD] = useState('');

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchStories = async () => {
    try {
      const { data, error } = await apiClient
        .from('success_stories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setStories(data || []);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل قصص النجاح', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  useEffect(() => {
    if (!isDialogOpen) return;
    let cancelled = false;

    apiClient.getAdminStudentsList().then(({ data }) => {
      if (!cancelled) setStudents((data ?? []).filter((s) => !s.is_admin));
    });

    apiClient.from('licenses').select().order('display_order', { ascending: true }).then(({ data }) => {
      if (!cancelled) {
        const rows = (data as LicenseRow[] | null) || [];
        setLicenses(rows.length > 0 ? rows : FALLBACK_LICENSES);
      }
    }).catch(() => {
      if (!cancelled) setLicenses(FALLBACK_LICENSES);
    });

    return () => { cancelled = true; };
  }, [isDialogOpen]);

  // ── Filtered student list ────────────────────────────────────────────────

  const effectiveLicenses = licenses.length > 0 ? licenses : FALLBACK_LICENSES;

  /** عند الإضافة: الاسم والرخصة يُحدَّدان فقط من «اختيار الطالب» وليس بالكتابة يدوياً */
  const lockNameAndLicenseFromPicker = !editingStory;

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const full = `${s.first_name} ${s.last_name} ${s.id_number ?? ''}`.toLowerCase();
      return full.includes(q);
    });
  }, [students, studentSearch]);

  // ── Form reset / open helpers ────────────────────────────────────────────

  const resetForm = () => {
    setName('');
    setLicenseType('');
    setRating(5);
    setReview('');
    setPassY('');
    setPassM('');
    setPassD('');
    setImageFile(null);
    setImagePreview('');
    setStudentSearch('');
    setSelectedUserId('');
  };

  const openEditDialog = (story: SuccessStory) => {
    setEditingStory(story);
    setName(story.name);
    setLicenseType(story.license_type);
    setRating(Number(story.rating) || 5);
    setReview(story.review);
    const { y, m, d } = splitPassDate(story.pass_date);
    setPassY(y);
    setPassM(m);
    setPassD(d);
    setImageFile(null);
    setImagePreview(resolveImageUrl(story.image_url));
    setStudentSearch('');
    setSelectedUserId('');
    setIsDialogOpen(true);
  };

  // ── Student selection ────────────────────────────────────────────────────

  const handleStudentSelect = (userId: string) => {
    setSelectedUserId(userId);
    const student = students.find((s) => s.user_id === userId);
    if (!student) return;
    const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim();
    setName(fullName || student.id_number || '');
    const licDisplay = formatLicenseDisplay(student.license_type, effectiveLicenses);
    setLicenseType(licDisplay || student.license_type || '');
  };

  // ── Image handling ───────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(String(ev.target?.result || ''));
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStory && !selectedUserId) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار طالب أولاً', variant: 'destructive' });
      return;
    }

    const passDate = buildPassDate(passY, passM, passD);
    if (!passDate) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال تاريخ النجاح كاملاً', variant: 'destructive' });
      return;
    }

    try {
      let imageUrl: string | null = editingStory?.image_url ?? null;

      if (imageFile) {
        setIsUploading(true);
        const { data: uploadData, error: uploadError } = await apiClient.uploadSuccessStoryImage(imageFile);
        setIsUploading(false);
        if (uploadError || !uploadData?.url) {
          toast({ title: 'خطأ', description: uploadError?.message || 'فشل رفع الصورة', variant: 'destructive' });
          return;
        }
        imageUrl = uploadData.url;
      } else if (!imagePreview && editingStory) {
        // المشرف أزال الصورة
        imageUrl = null;
      }

      const storyData = {
        name: name.trim(),
        license_type: licenseType.trim(),
        rating,
        review: review.trim(),
        pass_date: passDate,
        image_url: imageUrl,
      };

      if (editingStory) {
        const { error } = await apiClient.from('success_stories').update(storyData).eq('id', editingStory.id);
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث قصة النجاح بنجاح' });
      } else {
        const { error } = await apiClient.from('success_stories').insert([storyData]);
        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة قصة النجاح بنجاح' });
      }

      setIsDialogOpen(false);
      setEditingStory(null);
      resetForm();
      fetchStories();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  // ── Visibility / delete ──────────────────────────────────────────────────

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      const { error } = await apiClient.from('success_stories').update({ is_visible: !current }).eq('id', id);
      if (error) throw error;
      toast({ title: 'تم التحديث', description: `تم ${!current ? 'إظهار' : 'إخفاء'} القصة بنجاح` });
      fetchStories();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث حالة القصة', variant: 'destructive' });
    }
  };

  const deleteStory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القصة؟')) return;
    try {
      const { error } = await apiClient.from('success_stories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف القصة بنجاح' });
      fetchStories();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف القصة', variant: 'destructive' });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة نتائج الطلاب</CardTitle>
            <CardDescription>إضافة وتعديل وحذف قصص نجاح الطلاب</CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingStory(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingStory(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة قصة جديدة
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingStory ? 'تعديل قصة نجاح' : 'إضافة قصة نجاح جديدة'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 pt-2">

                {/* ── اختيار الطالب ───────────────────────────── */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">اختيار الطالب</p>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو رقم الهوية..."
                      className="pr-9"
                    />
                  </div>
                  <Select value={selectedUserId} onValueChange={handleStudentSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder={editingStory ? `(الحالي: ${editingStory.name})` : 'اختر طالباً...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          لا يوجد طلاب يطابقون البحث
                        </div>
                      ) : (
                        filteredStudents.map((s) => {
                          const label = [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
                          const primary = label || s.id_number || s.user_id.slice(0, 8);
                          return (
                            <SelectItem key={s.user_id} value={s.user_id}>
                              {primary}
                              {s.license_type ? ` — ${s.license_type}` : ''}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* ── الاسم والرخصة ────────────────────────────── */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ss-name">اسم الطالب</Label>
                    <Input
                      id="ss-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      readOnly={lockNameAndLicenseFromPicker}
                      required={Boolean(editingStory)}
                      placeholder="يُعبَّأ تلقائياً عند الاختيار"
                      className={
                        lockNameAndLicenseFromPicker
                          ? 'cursor-default bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                          : undefined
                      }
                      aria-readonly={lockNameAndLicenseFromPicker || undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ss-license">نوع الرخصة</Label>
                    <Input
                      id="ss-license"
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      readOnly={lockNameAndLicenseFromPicker}
                      required={Boolean(editingStory)}
                      placeholder="يُعبَّأ تلقائياً عند الاختيار"
                      className={
                        lockNameAndLicenseFromPicker
                          ? 'cursor-default bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                          : undefined
                      }
                      aria-readonly={lockNameAndLicenseFromPicker || undefined}
                    />
                  </div>
                </div>

                {/* ── تاريخ النجاح ─────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label>تاريخ النجاح</Label>
                  <div className="flex items-end gap-3" dir="ltr">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground text-center">سنة</span>
                      <Input
                        inputMode="numeric"
                        value={passY}
                        onChange={(e) => setPassY(digitsOnly(e.target.value, 4))}
                        placeholder="YYYY"
                        className="w-20 tabular-nums"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground text-center">شهر</span>
                      <Input
                        inputMode="numeric"
                        value={passM}
                        onChange={(e) => setPassM(digitsOnly(e.target.value, 2))}
                        placeholder="MM"
                        className="w-16 tabular-nums"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground text-center">يوم</span>
                      <Input
                        inputMode="numeric"
                        value={passD}
                        onChange={(e) => setPassD(digitsOnly(e.target.value, 2))}
                        placeholder="DD"
                        className="w-16 tabular-nums"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* ── التقييم ───────────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label>التقييم</Label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* ── الصورة ────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label>الصورة (اختياري)</Label>
                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="h-20 w-20 rounded-full object-cover border border-border"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={clearImage}>
                        <X className="h-4 w-4 ml-1" />
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">انقر لرفع صورة</p>
                      <p className="text-xs text-muted-foreground">JPG، PNG، WEBP (حتى 5 ميجابايت)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* ── التعليق ───────────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label htmlFor="ss-review">التعليق</Label>
                  <Textarea
                    id="ss-review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    required
                    rows={4}
                    placeholder="تعليق الطالب على تجربته..."
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setIsDialogOpen(false); setEditingStory(null); resetForm(); }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'جاري الرفع...' : editingStory ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {stories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد قصص نجاح بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الترتيب</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">نوع الرخصة</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                  <TableHead className="text-right">تاريخ النجاح</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell>{story.display_order}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {story.image_url && (
                          <img
                            src={resolveImageUrl(story.image_url)}
                            alt={story.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        {story.name}
                      </div>
                    </TableCell>
                    <TableCell>{story.license_type}</TableCell>
                    <TableCell>
                      <StarDisplay rating={Number(story.rating)} />
                    </TableCell>
                    <TableCell>{new Date(story.pass_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <Badge variant={story.is_visible ? 'default' : 'secondary'}>
                        {story.is_visible ? 'ظاهرة' : 'مخفية'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVisibility(story.id, story.is_visible)}
                        >
                          {story.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(story)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteStory(story.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
