import { useState, useEffect, useRef } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, Upload, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parseInstructorStudentComments, serializeInstructorStudentComments } from '@/lib/instructorStudentComments';

function newCommentRowKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type CommentRowState = { key: string; student_name: string; comment: string };

interface InstructorRow {
  id: string;
  name_ar: string;
  role_ar: string | null;
  bio_ar: string | null;
  image_url: string | null;
  rating_stars: number | string | null;
  students_trained: number | string | null;
  success_rate: number | string | null;
  student_comments: string | null;
  display_order: number;
  is_visible: boolean;
}

const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

/** نفس أسلوب تقييم قصص النجاح: 5 نجوم مع نصف نجمة */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex flex-wrap items-center gap-0.5 justify-start" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const fullFill = display >= star;
        const halfFill = !fullFill && display >= star - 0.5;
        return (
          <div key={star} className="relative w-7 h-7 cursor-pointer shrink-0">
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(star - 0.5)}
              aria-label={`${star - 0.5} نجوم`}
            />
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
                fullFill ? 'fill-yellow-400 text-yellow-400' : halfFill ? 'text-yellow-400' : 'text-gray-300'
              }`}
              style={halfFill ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
            />
            {halfFill ? <Star className="w-7 h-7 pointer-events-none absolute inset-0 text-gray-300" /> : null}
          </div>
        );
      })}
      <span className="mr-2 text-sm text-muted-foreground self-center">{display}/5</span>
    </div>
  );
}

export const AdminInstructors = () => {
  const [rows, setRows] = useState<InstructorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorRow | null>(null);
  const { toast } = useToast();

  const [nameAr, setNameAr] = useState('');
  const [roleAr, setRoleAr] = useState('');
  const [bioAr, setBioAr] = useState('');
  /** 0 = بدون تقييم (يُحفظ كـ null)، وإلا 0.5…5 مثل الطلاب في قصص النجاح */
  const [ratingValue, setRatingValue] = useState(0);
  const [studentsTrained, setStudentsTrained] = useState('');
  const [successRate, setSuccessRate] = useState('');
  const [commentRows, setCommentRows] = useState<CommentRowState[]>([]);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRows = async () => {
    try {
      const { data, error } = await apiClient
        .from('instructors')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setRows((data as InstructorRow[]) || []);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل بيانات المدربين', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const resetForm = () => {
    setNameAr('');
    setRoleAr('');
    setBioAr('');
    setRatingValue(0);
    setStudentsTrained('');
    setSuccessRate('');
    setCommentRows([]);
    setDisplayOrder('0');
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditing(null);
      resetForm();
    }
  };

  const openEdit = (row: InstructorRow) => {
    setEditing(row);
    setNameAr(row.name_ar);
    setRoleAr(row.role_ar || '');
    setBioAr(row.bio_ar || '');
    {
      const r = parseFloat(String(row.rating_stars ?? '').replace(',', '.'));
      setRatingValue(Number.isFinite(r) ? Math.min(5, Math.max(0, r)) : 0);
    }
    setStudentsTrained(row.students_trained != null && row.students_trained !== '' ? String(row.students_trained) : '');
    setSuccessRate(row.success_rate != null && row.success_rate !== '' ? String(row.success_rate) : '');
    {
      const items = parseInstructorStudentComments(row.student_comments);
      setCommentRows(
        items.map((x) => ({
          key: newCommentRowKey(),
          student_name: x.student_name,
          comment: x.comment,
        }))
      );
    }
    setDisplayOrder(String(row.display_order ?? 0));
    setImageFile(null);
    setImagePreview(resolveImageUrl(row.image_url));
    setIsDialogOpen(true);
  };

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

  const addCommentRow = () => {
    setCommentRows((prev) => [...prev, { key: newCommentRowKey(), student_name: '', comment: '' }]);
  };

  const updateCommentRow = (key: string, field: 'student_name' | 'comment', value: string) => {
    setCommentRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const removeCommentRow = (key: string) => {
    setCommentRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameAr.trim();
    if (!name) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال اسم المدرب', variant: 'destructive' });
      return;
    }
    const orderNum = Math.max(0, parseInt(displayOrder, 10) || 0);

    const ratingStarsVal =
      ratingValue > 0 ? Math.min(5, Math.round(ratingValue * 2) / 2) : null;

    const studentsRaw = studentsTrained.trim();
    let studentsVal: number | null = null;
    if (studentsRaw !== '') {
      const n = parseInt(studentsRaw, 10);
      if (Number.isNaN(n) || n < 0) {
        toast({ title: 'تنبيه', description: 'عدد الطلاب يجب أن يكون رقماً صحيحاً غير سالب', variant: 'destructive' });
        return;
      }
      studentsVal = n;
    }

    const rateRaw = successRate.trim();
    let rateVal: number | null = null;
    if (rateRaw !== '') {
      const n = parseFloat(rateRaw.replace(',', '.'));
      if (Number.isNaN(n) || n < 0 || n > 100) {
        toast({ title: 'تنبيه', description: 'نسبة النجاح يجب أن تكون بين 0 و 100', variant: 'destructive' });
        return;
      }
      rateVal = Math.round(n * 100) / 100;
    }

    const studentCommentsSerialized = serializeInstructorStudentComments(
      commentRows.map(({ student_name, comment }) => ({ student_name, comment }))
    );

    try {
      let imageUrl: string | null = editing?.image_url ?? null;

      if (imageFile) {
        setIsUploading(true);
        const { data: uploadData, error: uploadError } = await apiClient.uploadInstructorImage(imageFile);
        setIsUploading(false);
        if (uploadError || !uploadData?.url) {
          toast({ title: 'خطأ', description: uploadError?.message || 'فشل رفع الصورة', variant: 'destructive' });
          return;
        }
        imageUrl = uploadData.url;
      } else if (!imagePreview && editing) {
        imageUrl = null;
      }

      const payload = {
        name_ar: name,
        role_ar: roleAr.trim() || null,
        bio_ar: bioAr.trim() || null,
        image_url: imageUrl,
        rating_stars: ratingStarsVal,
        students_trained: studentsVal,
        success_rate: rateVal,
        student_comments: studentCommentsSerialized,
        display_order: orderNum,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await apiClient.from('instructors').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم حفظ بيانات المدرب' });
      } else {
        const { error } = await apiClient.from('instructors').insert([
          {
            name_ar: name,
            role_ar: roleAr.trim() || null,
            bio_ar: bioAr.trim() || null,
            image_url: imageUrl,
            rating_stars: ratingStarsVal,
            students_trained: studentsVal,
            success_rate: rateVal,
            student_comments: studentCommentsSerialized,
            display_order: orderNum,
            is_visible: true,
          },
        ]);
        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة المدرب بنجاح' });
      }

      setIsDialogOpen(false);
      setEditing(null);
      resetForm();
      fetchRows();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      const { error } = await apiClient
        .from('instructors')
        .update({ is_visible: !current, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'تم التحديث', description: !current ? 'أصبح المدرب ظاهراً في الموقع' : 'تم إخفاء المدرب عن الموقع' });
      fetchRows();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث الظهور', variant: 'destructive' });
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرب؟')) return;
    try {
      const { error } = await apiClient.from('instructors').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف المدرب' });
      fetchRows();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في الحذف', variant: 'destructive' });
    }
  };

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
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>إدارة المدربين</CardTitle>
          <CardDescription>المحتوى المعروض في صفحة «مدربينا» في الموقع العام</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة مدرب
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? 'تعديل مدرب' : 'إضافة مدرب'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instructor-name">الاسم</Label>
                  <Input
                    id="instructor-name"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructor-role">المسمى (اختياري)</Label>
                  <Input
                    id="instructor-role"
                    value={roleAr}
                    onChange={(e) => setRoleAr(e.target.value)}
                    placeholder="مثال: مدرب معتمد"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructor-bio">نبذة (اختياري)</Label>
                  <Textarea
                    id="instructor-bio"
                    value={bioAr}
                    onChange={(e) => setBioAr(e.target.value)}
                    rows={4}
                    placeholder="خبرات وشهادات أو تخصص التدريب..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label>التقييم (5 نجوم — مثل الطلاب)</Label>
                    <StarRating value={ratingValue} onChange={setRatingValue} />
                    {ratingValue > 0 ? (
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs justify-start px-0" onClick={() => setRatingValue(0)}>
                        إزالة التقييم
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructor-students">عدد الطلاب الذين درّبهم</Label>
                    <Input
                      id="instructor-students"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={studentsTrained}
                      onChange={(e) => setStudentsTrained(e.target.value)}
                      placeholder="مثال: 120"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructor-success">نسبة النجاح (%)</Label>
                    <Input
                      id="instructor-success"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.01}
                      value={successRate}
                      onChange={(e) => setSuccessRate(e.target.value)}
                      placeholder="مثال: 92"
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <div>
                    <Label>تعليقات الطلاب (اختياري)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      أضف اسم الطالب وتعليقه لكل صف؛ يمكنك إضافة أي عدد من التعليقات.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {commentRows.map((row, index) => (
                      <div
                        key={row.key}
                        className="rounded-lg border border-border bg-muted/20 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-muted-foreground">طالب {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => removeCommentRow(row.key)}
                            aria-label="حذف التعليق"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs" htmlFor={`st-name-${row.key}`}>
                            اسم الطالب
                          </Label>
                          <Input
                            id={`st-name-${row.key}`}
                            value={row.student_name}
                            onChange={(e) => updateCommentRow(row.key, 'student_name', e.target.value)}
                            placeholder="الاسم"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs" htmlFor={`st-comment-${row.key}`}>
                            التعليق
                          </Label>
                          <Textarea
                            id={`st-comment-${row.key}`}
                            value={row.comment}
                            onChange={(e) => updateCommentRow(row.key, 'comment', e.target.value)}
                            rows={3}
                            placeholder="تعليق الطالب عن المدرب..."
                            className="resize-y min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-1 w-full sm:w-fit" onClick={addCommentRow}>
                    <Plus className="h-4 w-4" />
                    إضافة تعليق طالب
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructor-order">ترتيب العرض</Label>
                  <Input
                    id="instructor-order"
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>الصورة</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} id="instructor-photo" />
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      اختيار صورة
                    </Button>
                    {imagePreview ? (
                      <Button type="button" variant="ghost" size="sm" onClick={clearImage} className="gap-1 text-destructive">
                        <X className="h-4 w-4" />
                        إزالة
                      </Button>
                    ) : null}
                  </div>
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="mt-2 h-32 w-32 rounded-lg object-cover border" />
                  ) : null}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'جاري الرفع...' : editing ? 'حفظ' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا يوجد مدربون بعد. اضغط «إضافة مدرب» للبدء.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">المسمى</TableHead>
                  <TableHead className="text-right min-w-[100px]">إحصاءات</TableHead>
                  <TableHead className="text-right">الترتيب</TableHead>
                  <TableHead className="text-right">الظهور</TableHead>
                  <TableHead className="text-right whitespace-nowrap min-w-[148px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.image_url ? (
                        <img
                          src={resolveImageUrl(row.image_url)}
                          alt=""
                          className="h-12 w-12 rounded-md object-cover border"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.name_ar}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate">{row.role_ar || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {[
                        row.rating_stars != null && row.rating_stars !== '' ? `★ ${row.rating_stars}` : null,
                        row.students_trained != null && row.students_trained !== '' ? `${row.students_trained} طالب` : null,
                        row.success_rate != null && row.success_rate !== '' ? `${row.success_rate}%` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </TableCell>
                    <TableCell>{row.display_order}</TableCell>
                    <TableCell>
                      {row.is_visible ? (
                        <Badge variant="secondary">ظاهر</Badge>
                      ) : (
                        <Badge variant="outline">مخفي</Badge>
                      )}
                    </TableCell>
                    <TableCell className="w-[1%] whitespace-nowrap align-middle">
                      <div
                        className="inline-flex flex-nowrap items-center gap-0 rounded-lg border border-border/80 bg-muted/40 p-0.5 shadow-sm"
                        dir="ltr"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-md hover:bg-background/80"
                          onClick={() => toggleVisibility(row.id, row.is_visible)}
                          title={row.is_visible ? 'إخفاء عن الموقع' : 'إظهار على الموقع'}
                        >
                          {row.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-md hover:bg-background/80"
                          onClick={() => openEdit(row)}
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteRow(row.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
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
