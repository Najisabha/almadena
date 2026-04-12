import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, Upload, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';

interface TrafficSign {
  id: string;
  section_key: string;
  sign_number: number;
  sign_code: string;
  title: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
}

const SECTION_OPTIONS = [
  { key: 'warning',       label: 'اشارات تحذير',            letter: 'أ' },
  { key: 'guidance',      label: 'اشارات ارشاد',            letter: 'ب' },
  { key: 'inquiry',       label: 'اشارات استعلام',          letter: 'ج' },
  { key: 'road-surface',  label: 'اشارات على سطح الطريق',   letter: 'د' },
  { key: 'traffic-lights',label: 'اشارات الضوئية',          letter: 'ه' },
  { key: 'support',       label: 'اشارات مساعدة',           letter: 'و' },
];

const getSectionOption = (key: string) => SECTION_OPTIONS.find((s) => s.key === key);
const getSectionLabel  = (key: string) => getSectionOption(key)?.label ?? key;
const getSectionLetter = (key: string) => getSectionOption(key)?.letter ?? '';

function buildSignCode(sectionKey: string, signNumber: number | string, suffix = ''): string {
  const letter = getSectionLetter(sectionKey);
  if (!letter || !signNumber) return '';
  const base = `${letter}-${signNumber}`;
  const s = suffix.trim();
  return s ? `${base}-${s}` : base;
}

/** ترتيب أبجدي عربي حسب الكود (أ → ي) مع الرقم */
function sortSignsByArabicCode(signs: TrafficSign[]): TrafficSign[] {
  return [...signs].sort((a, b) => {
    const codeCmp = a.sign_code.localeCompare(b.sign_code, 'ar', { sensitivity: 'base', numeric: true });
    if (codeCmp !== 0) return codeCmp;
    const titleCmp = a.title.localeCompare(b.title, 'ar', { sensitivity: 'base', numeric: true });
    return titleCmp !== 0 ? titleCmp : a.id.localeCompare(b.id);
  });
}

const emptyForm = {
  section_key: '',
  sign_number: '' as string | number,
  title: '',
  description: '',
};

export const AdminTrafficSigns = () => {
  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSign, setEditingSign] = useState<TrafficSign | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSubSign, setIsSubSign] = useState(false);
  const [subSignSuffix, setSubSignSuffix] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const previewCode = buildSignCode(
    formData.section_key,
    formData.sign_number,
    isSubSign ? subSignSuffix : '',
  );
  const isSubSignVariant = isSubSign && subSignSuffix.trim().length > 0;
  const normalizedTitle = formData.title.trim().toLocaleLowerCase();
  const normalizedSignNumber = Number(formData.sign_number);
  const duplicateTitleSign = normalizedTitle
    ? signs.find((sign) => {
        const isSameRecord = editingSign ? sign.id === editingSign.id : false;
        if (isSameRecord) return false;
        return sign.title.trim().toLocaleLowerCase() === normalizedTitle;
      })
    : null;
  const baseSignCode = buildSignCode(formData.section_key, formData.sign_number);
  const targetSignCode =
    baseSignCode &&
    (Number.isFinite(normalizedSignNumber) && normalizedSignNumber > 0
      ? isSubSignVariant
        ? buildSignCode(formData.section_key, formData.sign_number, subSignSuffix.trim())
        : baseSignCode
      : '');
  const duplicateSignCodeRow = targetSignCode
    ? signs.find((sign) => {
        const isSameRecord = editingSign ? sign.id === editingSign.id : false;
        if (isSameRecord) return false;
        return sign.sign_code === targetSignCode;
      })
    : null;

  const fetchSigns = async () => {
    try {
      const { data, error } = await apiClient.from('traffic_signs').select();
      if (error) throw error;
      setSigns(sortSignsByArabicCode((data as TrafficSign[]) || []));
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل الإشارات', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSigns(); }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setIsSubSign(false);
    setSubSignSuffix('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const uploadImage = async (
    sectionKey: string,
    signNumber: string | number,
    signSuffix?: string,
  ): Promise<string> => {
    if (!imageFile) throw new Error('لم يتم اختيار صورة');
    const token = localStorage.getItem('almadena_token');
    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('section_key', sectionKey);
    fd.append('sign_number', String(signNumber));
    if (signSuffix?.trim()) fd.append('sign_suffix', signSuffix.trim());
    const res = await fetch(`${API_BASE}/upload/signs`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل رفع الصورة');
    return json.url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.section_key || !formData.title.trim() || !formData.sign_number) {
      toast({ title: 'خطأ', description: 'القسم واسم الإشارة ورقمها مطلوبة', variant: 'destructive' });
      return;
    }
    if (duplicateSignCodeRow) {
      toast({ title: 'كود مكرر', description: 'كود الشاخصة مستخدم مسبقًا', variant: 'destructive' });
      return;
    }
    if (duplicateTitleSign) {
      toast({ title: 'اسم مكرر', description: 'اسم الشاخصة موجود مسبقًا، اختر اسمًا مختلفًا', variant: 'destructive' });
      return;
    }
    if (!editingSign && !imageFile) {
      toast({ title: 'خطأ', description: 'يجب رفع صورة للإشارة', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      let image_url = editingSign?.image_url ?? '';
      if (imageFile) {
        image_url = `http://localhost:4000${await uploadImage(
          formData.section_key,
          formData.sign_number,
          isSubSignVariant ? subSignSuffix.trim() : undefined,
        )}`;
      }

      const sign_code = buildSignCode(
        formData.section_key,
        formData.sign_number,
        isSubSignVariant ? subSignSuffix.trim() : '',
      );
      const payload = {
        section_key: formData.section_key,
        sign_number: Number(formData.sign_number),
        sign_code,
        title: formData.title,
        description: formData.description || null,
        image_url,
      };

      if (editingSign) {
        const { error } = await apiClient.from('traffic_signs').update(payload).eq('id', editingSign.id);
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث الإشارة بنجاح' });
      } else {
        const { error } = await apiClient.from('traffic_signs').insert([{ ...payload, is_active: true }]);
        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة الإشارة بنجاح' });
      }

      setIsDialogOpen(false);
      setEditingSign(null);
      resetForm();
      fetchSigns();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await apiClient.from('traffic_signs').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      toast({ title: 'تم التحديث', description: `تم ${!current ? 'تفعيل' : 'إلغاء تفعيل'} الإشارة` });
      fetchSigns();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteSign = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الإشارة؟')) return;
    try {
      const { error } = await apiClient.from('traffic_signs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الإشارة بنجاح' });
      fetchSigns();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (sign: TrafficSign) => {
    setEditingSign(sign);
    setFormData({
      section_key: sign.section_key,
      sign_number: sign.sign_number,
      title: sign.title,
      description: sign.description || '',
    });
    setImageFile(null);
    setImagePreview(sign.image_url || null);
    const base = buildSignCode(sign.section_key, sign.sign_number);
    if (base && sign.sign_code !== base && sign.sign_code.startsWith(`${base}-`)) {
      setIsSubSign(true);
      setSubSignSuffix(sign.sign_code.slice(base.length + 1));
    } else {
      setIsSubSign(false);
      setSubSignSuffix('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsDialogOpen(true);
  };

  const exportToExcel = () => {
    if (signs.length === 0) {
      toast({ title: 'تنبيه', description: 'لا توجد شواخص للتصدير' });
      return;
    }

    const rows = signs.map((sign) => ({
      'الكود': sign.sign_code,
      'القسم': getSectionLabel(sign.section_key),
      'الاسم': sign.title,
      'الوصف': sign.description ?? '',
      'الحالة': sign.is_active ? 'نشط' : 'غير نشط',
      'رابط الصورة': sign.image_url,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 35 },
      { wch: 40 },
      { wch: 12 },
      { wch: 55 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الشواخص');
    XLSX.writeFile(workbook, 'الشواخص.xlsx');

    toast({ title: 'تم التصدير', description: `تم تصدير ${signs.length} شاخصة بنجاح` });
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة الشواخص</CardTitle>
            <CardDescription>إضافة وتعديل وحذف شواخص المرور مع صورة إجبارية لكل شاخصة</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={signs.length === 0}>
              <FileDown className="ml-2 h-4 w-4" />
              تصدير الشواخص
            </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setEditingSign(null); resetForm(); } setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingSign(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة شاخصة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingSign ? 'تعديل شاخصة' : 'إضافة شاخصة جديدة'}</DialogTitle>
                <DialogDescription>أدخل تفاصيل الشاخصة واختر القسم ورقمها</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* القسم */}
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Select
                    value={formData.section_key}
                    onValueChange={(v) => setFormData({ ...formData, section_key: v })}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_OPTIONS.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label} ({s.letter})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* رقم الشاخصة */}
                <div className="space-y-2">
                  <Label htmlFor="sign-number">رقم الشاخصة</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="sign-number"
                      type="number"
                      min={1}
                      placeholder="مثال: 1"
                      value={formData.sign_number}
                      onChange={(e) => setFormData({ ...formData, sign_number: e.target.value })}
                      required
                      className="text-right"
                    />
                    {previewCode && (
                      <span className="shrink-0 bg-primary/10 text-primary font-bold px-3 py-2 rounded-md text-sm border border-primary/30">
                        [{previewCode}]
                      </span>
                    )}
                  </div>
                  {previewCode && (
                    <p className="text-xs text-muted-foreground">كود الشاخصة: <strong>[{previewCode}]</strong></p>
                  )}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sub-sign"
                        checked={isSubSign}
                        onCheckedChange={(checked) => {
                          const on = checked === true;
                          setIsSubSign(on);
                          if (!on) setSubSignSuffix('');
                        }}
                      />
                      <Label htmlFor="sub-sign" className="text-sm font-normal cursor-pointer">
                        إشارة فرعية
                      </Label>
                    </div>
                    {isSubSign && (
                      <Input
                        id="sub-sign-suffix"
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        placeholder="أ"
                        value={subSignSuffix}
                        onChange={(e) => setSubSignSuffix(e.target.value.slice(-1))}
                        className="text-right w-16"
                        dir="rtl"
                        aria-label="حرف الامتداد للمعاينة"
                      />
                    )}
                  </div>
                  {duplicateSignCodeRow && (
                    <p className="text-xs text-destructive">
                      كود الشاخصة مكرر وممنوع إضافته. الكود المستخدم حاليًا: [{duplicateSignCodeRow.sign_code}]
                    </p>
                  )}
                </div>

                {/* اسم الإشارة */}
                <div className="space-y-2">
                  <Label htmlFor="sign-title">اسم الإشارة</Label>
                  <Input
                    id="sign-title"
                    placeholder="مثال: انعطاف حاد إلى اليمين"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="text-right"
                  />
                  {duplicateTitleSign && (
                    <p className="text-xs text-destructive">
                      اسم الشاخصة مكرر وممنوع إضافته. الاسم المستخدم حاليًا: {duplicateTitleSign.title}
                    </p>
                  )}
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                  <Label htmlFor="sign-description">الوصف (اختياري)</Label>
                  <Textarea
                    id="sign-description"
                    placeholder="وصف مختصر للإشارة"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="text-right"
                  />
                </div>

                {/* رفع الصورة */}
                <div className="space-y-2">
                  <Label htmlFor="sign-image">
                    صورة الإشارة {!editingSign && <span className="text-destructive">*</span>}
                  </Label>
                  <div
                    className="border-2 border-dashed border-primary/30 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/60 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="h-28 w-28 object-contain rounded"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">اضغط لاختيار صورة</p>
                      </>
                    )}
                    {imageFile && (
                      <p className="text-xs text-primary">{imageFile.name}</p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="sign-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    required={!editingSign}
                  />
                  {editingSign && !imageFile && (
                    <p className="text-xs text-muted-foreground">اتركه فارغًا للإبقاء على الصورة الحالية</p>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={uploading || !!duplicateTitleSign || !!duplicateSignCodeRow}>
                    {uploading ? 'جاري الرفع...' : editingSign ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {signs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد شواخص بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signs.map((sign) => (
                  <TableRow key={sign.id}>
                    <TableCell>
                      <span className="font-bold text-primary">[{sign.sign_code}]</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getSectionLabel(sign.section_key)}</Badge>
                    </TableCell>
                    <TableCell>
                      <img
                        src={sign.image_url}
                        alt={sign.title}
                        className="h-12 w-12 rounded object-contain border bg-muted"
                        loading="lazy"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{sign.title}</TableCell>
                    <TableCell>
                      <Badge variant={sign.is_active ? 'default' : 'secondary'}>
                        {sign.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleActive(sign.id, sign.is_active)} title={sign.is_active ? 'إلغاء التفعيل' : 'تفعيل'}>
                          {sign.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(sign)} title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteSign(sign.id)} title="حذف">
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
