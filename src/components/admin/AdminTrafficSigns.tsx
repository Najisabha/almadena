import { useState, useEffect, useRef } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, Upload } from 'lucide-react';
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

function buildSignCode(sectionKey: string, signNumber: number | string): string {
  const letter = getSectionLetter(sectionKey);
  if (!letter || !signNumber) return '';
  return `${letter}-${signNumber}`;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const previewCode = buildSignCode(formData.section_key, formData.sign_number);
  const normalizedTitle = formData.title.trim().toLocaleLowerCase();
  const normalizedSignNumber = Number(formData.sign_number);
  const duplicateTitleSign = normalizedTitle
    ? signs.find((sign) => {
        const isSameRecord = editingSign ? sign.id === editingSign.id : false;
        if (isSameRecord) return false;
        return sign.title.trim().toLocaleLowerCase() === normalizedTitle;
      })
    : null;
  const duplicateNumberSign = formData.section_key && Number.isFinite(normalizedSignNumber) && normalizedSignNumber > 0
    ? signs.find((sign) => {
        const isSameRecord = editingSign ? sign.id === editingSign.id : false;
        if (isSameRecord) return false;
        return sign.section_key === formData.section_key && sign.sign_number === normalizedSignNumber;
      })
    : null;

  const fetchSigns = async () => {
    try {
      const { data, error } = await apiClient
        .from('traffic_signs')
        .select()
        .order('sign_number', { ascending: true });
      if (error) throw error;
      setSigns((data as TrafficSign[]) || []);
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

  const uploadImage = async (sectionKey: string, signNumber: string | number): Promise<string> => {
    if (!imageFile) throw new Error('لم يتم اختيار صورة');
    const token = localStorage.getItem('almadena_token');
    const fd = new FormData();
    fd.append('image', imageFile);
    fd.append('section_key', sectionKey);
    fd.append('sign_number', String(signNumber));
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
    if (duplicateNumberSign) {
      toast({ title: 'رقم مكرر', description: 'رقم الشاخصة مستخدم مسبقًا ضمن نفس القسم', variant: 'destructive' });
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
        image_url = `http://localhost:4000${await uploadImage(formData.section_key, formData.sign_number)}`;
      }

      const sign_code = buildSignCode(formData.section_key, formData.sign_number);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsDialogOpen(true);
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
                  {duplicateNumberSign && (
                    <p className="text-xs text-destructive">
                      رقم الشاخصة مكرر ضمن نفس القسم وممنوع إضافته. الرقم المستخدم حاليًا: {duplicateNumberSign.sign_number}
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
                  <Button type="submit" disabled={uploading || !!duplicateTitleSign || !!duplicateNumberSign}>
                    {uploading ? 'جاري الرفع...' : editingSign ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
