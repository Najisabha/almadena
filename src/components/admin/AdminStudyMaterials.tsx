import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, Video, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StudyMaterial {
  id: string;
  title: string;
  title_ar: string;
  material_type: string;
  content_url: string | null;
  zoom_meeting_id: string | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  is_active: boolean;
}

const materialTypeLabels: Record<string, string> = {
  video: 'فيديو',
  pdf: 'ملف PDF',
  zoom: 'جلسة Zoom',
  article: 'مقال',
  quiz: 'اختبار',
};

const materialTypeIcons: Record<string, any> = {
  video: Video,
  pdf: FileText,
  zoom: Video,
  article: FileText,
  quiz: FileText,
};

export const AdminStudyMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    material_type: 'video',
    content_url: '',
    zoom_meeting_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '',
  });

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المواد الدراسية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('study_materials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم التحديث', description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المادة` });
      fetchMaterials();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

    try {
      const { error } = await supabase.from('study_materials').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف المادة بنجاح' });
      fetchMaterials();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scheduledDateTime = formData.scheduled_date && formData.scheduled_time
        ? `${formData.scheduled_date}T${formData.scheduled_time}`
        : null;

      const materialData = {
        title: formData.title,
        title_ar: formData.title_ar,
        material_type: formData.material_type,
        content_url: formData.content_url || null,
        zoom_meeting_id: formData.zoom_meeting_id || null,
        scheduled_date: scheduledDateTime,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from('study_materials')
          .update(materialData)
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث المادة بنجاح' });
      } else {
        const { error } = await supabase
          .from('study_materials')
          .insert([materialData]);

        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة المادة بنجاح' });
      }

      setIsDialogOpen(false);
      setEditingMaterial(null);
      resetForm();
      fetchMaterials();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_ar: '',
      material_type: 'video',
      content_url: '',
      zoom_meeting_id: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: '',
    });
  };

  const openEditDialog = (material: StudyMaterial) => {
    const date = material.scheduled_date ? new Date(material.scheduled_date) : null;
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      title_ar: material.title_ar,
      material_type: material.material_type,
      content_url: material.content_url || '',
      zoom_meeting_id: material.zoom_meeting_id || '',
      scheduled_date: date ? format(date, 'yyyy-MM-dd') : '',
      scheduled_time: date ? format(date, 'HH:mm') : '',
      duration_minutes: material.duration_minutes?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة المواد الدراسية</CardTitle>
            <CardDescription>إدارة الفيديوهات، الملفات، وجلسات Zoom</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingMaterial(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مادة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'تعديل مادة دراسية' : 'إضافة مادة دراسية جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title_ar">العنوان (عربي)</Label>
                    <Input
                      id="title_ar"
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">العنوان (English)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="material_type">نوع المادة</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">فيديو</SelectItem>
                      <SelectItem value="pdf">ملف PDF</SelectItem>
                      <SelectItem value="zoom">جلسة Zoom</SelectItem>
                      <SelectItem value="article">مقال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.material_type === 'zoom' ? (
                  <div>
                    <Label htmlFor="zoom_meeting_id">معرف اجتماع Zoom</Label>
                    <Input
                      id="zoom_meeting_id"
                      value={formData.zoom_meeting_id}
                      onChange={(e) => setFormData({ ...formData, zoom_meeting_id: e.target.value })}
                      placeholder="123-456-7890"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="content_url">رابط المحتوى</Label>
                    <Input
                      id="content_url"
                      type="url"
                      value={formData.content_url}
                      onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">تاريخ الجدولة</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduled_time">وقت الجدولة</Label>
                    <Input
                      id="scheduled_time"
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration_minutes">المدة (بالدقائق)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingMaterial ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مواد دراسية بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">التاريخ المجدول</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const Icon = materialTypeIcons[material.material_type] || FileText;
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {material.title_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {materialTypeLabels[material.material_type] || material.material_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {material.scheduled_date
                          ? format(new Date(material.scheduled_date), 'PPp', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell>{material.duration_minutes ? `${material.duration_minutes} دقيقة` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={material.is_active ? 'default' : 'secondary'}>
                          {material.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(material.id, material.is_active)}
                          >
                            {material.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(material)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMaterial(material.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
