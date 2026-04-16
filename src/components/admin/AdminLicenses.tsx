import { useEffect, useState } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type License = {
  id: string;
  code: string;
  name_ar: string;
  icon_url?: string | null;
  difficulty_level?: string | null;
  bg_color?: string | null;
  display_order: number;
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${API_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function getToken() {
  return localStorage.getItem('almadena_token');
}

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    name_ar: '',
    icon_url: '',
    difficulty_level: 'متوسط',
    bg_color: '#ffffff',
    display_order: '1',
  });

  const resetForm = () => {
    setEditingLicense(null);
    setFormData({
      code: '',
      name_ar: '',
      icon_url: '',
      difficulty_level: 'متوسط',
      bg_color: '#ffffff',
      display_order: String(Math.max(licenses.length + 1, 1)),
    });
  };

  const fetchLicenses = async () => {
    try {
      const { data, error } = await apiClient
        .from('licenses')
        .select()
        .order('display_order', { ascending: true });
      if (error) throw error;
      setLicenses((data as License[]) || []);
    } catch (error: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل الرخص', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const uploadLicenseIcon = async (file: File) => {
    const token = getToken();
    const fd = new FormData();
    fd.append('image', file);
    const response = await fetch(`${API_BASE}/api/upload/licenses`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const bodyText = await response.text();
      if (bodyText.includes('<!DOCTYPE')) {
        throw new Error('الخادم أعاد صفحة HTML بدل JSON. غالباً يلزم إعادة تشغيل backend أو ضبط VITE_API_URL.');
      }
      throw new Error('استجابة غير صالحة من الخادم أثناء رفع الأيقونة.');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'فشل رفع الأيقونة');
    return data.url as string;
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingIcon(true);
      const uploadedUrl = await uploadLicenseIcon(file);
      setFormData((prev) => ({ ...prev, icon_url: uploadedUrl }));
      toast({ title: 'تم الرفع', description: 'تم رفع أيقونة الرخصة بنجاح' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل رفع الأيقونة', variant: 'destructive' });
    } finally {
      setIsUploadingIcon(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    const nameAr = formData.name_ar.trim();
    const iconUrl = formData.icon_url.trim();
    const difficultyLevel = formData.difficulty_level.trim() || 'متوسط';
    const bgColor = formData.bg_color.trim() || '#ffffff';
    const displayOrder = Number(formData.display_order);

    if (!code || !nameAr || Number.isNaN(displayOrder) || displayOrder < 1) {
      toast({ title: 'خطأ', description: 'يرجى تعبئة الحقول بشكل صحيح', variant: 'destructive' });
      return;
    }

    try {
      if (editingLicense) {
        const { error } = await apiClient
          .from('licenses')
          .update({
            code,
            name_ar: nameAr,
            icon_url: iconUrl || null,
            difficulty_level: difficultyLevel,
            bg_color: bgColor,
            display_order: displayOrder,
          })
          .eq('id', editingLicense.id);
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث الرخصة بنجاح' });
      } else {
        const { error } = await apiClient.from('licenses').insert([
          {
            code,
            name_ar: nameAr,
            icon_url: iconUrl || null,
            difficulty_level: difficultyLevel,
            bg_color: bgColor,
            display_order: displayOrder,
          },
        ]);
        if (error) throw error;
        toast({
          title: 'تمت الإضافة',
          description: 'تم إدراج الرخصة بنجاح. أُنشئ قسم أسعار وباقة سعر افتراضية تلقائياً في «الأسعار».',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLicenses();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل حفظ الرخصة (تأكد أن رمز الرخصة غير مكرر)',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (license: License) => {
    setEditingLicense(license);
    setFormData({
      code: license.code,
      name_ar: license.name_ar,
      icon_url: license.icon_url || '',
      difficulty_level: license.difficulty_level || 'متوسط',
      bg_color: license.bg_color || '#ffffff',
      display_order: String(license.display_order),
    });
    setIsDialogOpen(true);
  };

  const deleteLicense = async (license: License) => {
    if (!confirm(`هل تريد حذف الرخصة ${license.name_ar} (${license.code})؟`)) return;
    try {
      const { error } = await apiClient.from('licenses').delete().eq('id', license.id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الرخصة بنجاح' });
      fetchLicenses();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'تعذر حذف الرخصة (قد تكون مرتبطة بأسئلة)',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>الرخص المعتمدة</CardTitle>
            <CardDescription>إدارة ديناميكية للرخص المعتمدة في الأكاديمية</CardDescription>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="ml-2 h-4 w-4" />
                إدراج رخصة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingLicense ? 'تعديل رخصة' : 'إدراج رخصة جديدة'}</DialogTitle>
                <DialogDescription>أدخل بيانات الرخصة ثم احفظها</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="license-code">رمز الرخصة</Label>
                  <Input
                    id="license-code"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="مثال: B أو C1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license-name-ar">اسم الرخصة</Label>
                  <Input
                    id="license-name-ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="مثال: خصوصي"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license-icon-file">صورة / أيقونة الرخصة</Label>
                  <Input
                    id="license-icon-file"
                    type="file"
                    accept="image/*"
                    onChange={handleIconFileChange}
                    disabled={isUploadingIcon}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isUploadingIcon ? 'جاري رفع الصورة...' : 'اختر ملف صورة من جهازك. الروابط الخارجية غير مدعومة.'}
                  </p>
                  {formData.icon_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={resolveImageUrl(formData.icon_url)}
                        alt="معاينة الأيقونة"
                        className="h-10 w-10 rounded border bg-white object-contain"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData((prev) => ({ ...prev, icon_url: '' }))}
                      >
                        إزالة الصورة
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="license-difficulty">مستوى الصعوبة</Label>
                  <select
                    id="license-difficulty"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData((prev) => ({ ...prev, difficulty_level: e.target.value }))}
                  >
                    <option value="سهل">سهل</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                    <option value="أساسي">أساسي</option>
                    <option value="صعب">صعب</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="license-bg-color">لون الخلفية</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="license-bg-color"
                      type="color"
                      value={formData.bg_color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bg_color: e.target.value }))}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      value={formData.bg_color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bg_color: e.target.value }))}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="license-display-order">الترتيب</Label>
                  <Input
                    id="license-display-order"
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: e.target.value }))}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">{editingLicense ? 'حفظ التعديل' : 'إدراج الرخصة'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {licenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد رخص حالياً. اضغط «إدراج رخصة» لإضافة أول رخصة.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رمز الرخصة</TableHead>
                <TableHead className="text-right">اسم الرخصة</TableHead>
                <TableHead className="text-right">الصورة/الأيقونة</TableHead>
                <TableHead className="text-right">مستوى الصعوبة</TableHead>
                <TableHead className="text-right">لون الخلفية</TableHead>
                <TableHead className="text-right">الترتيب</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-bold">{license.code}</TableCell>
                  <TableCell>{license.name_ar}</TableCell>
                  <TableCell>
                    {license.icon_url ? (
                      <img
                        src={resolveImageUrl(license.icon_url)}
                        alt={license.name_ar}
                        className="h-8 w-8 rounded object-contain border bg-white"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{license.difficulty_level || 'متوسط'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded border"
                        style={{ backgroundColor: license.bg_color || '#ffffff' }}
                      />
                      <span className="text-xs text-muted-foreground">{license.bg_color || '#ffffff'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{license.display_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(license)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteLicense(license)}>
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
};
