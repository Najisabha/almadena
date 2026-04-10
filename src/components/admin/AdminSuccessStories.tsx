import { useState, useEffect } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
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

export const AdminSuccessStories = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    license_type: '',
    rating: '5',
    review: '',
    pass_date: '',
    image_url: '',
  });

  const fetchStories = async () => {
    try {
      const { data, error } = await apiClient
        .from('success_stories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error('Error fetching success stories:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قصص النجاح',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await apiClient
        .from('success_stories')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${!currentVisibility ? 'إظهار' : 'إخفاء'} القصة بنجاح`,
      });

      fetchStories();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة القصة',
        variant: 'destructive',
      });
    }
  };

  const deleteStory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القصة؟')) return;

    try {
      const { error } = await apiClient
        .from('success_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف القصة بنجاح',
      });

      fetchStories();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف القصة',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const storyData = {
        name: formData.name,
        license_type: formData.license_type,
        rating: parseInt(formData.rating),
        review: formData.review,
        pass_date: formData.pass_date,
        image_url: formData.image_url || null,
      };

      if (editingStory) {
        const { error } = await apiClient
          .from('success_stories')
          .update(storyData)
          .eq('id', editingStory.id);

        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث قصة النجاح بنجاح' });
      } else {
        const { error } = await apiClient
          .from('success_stories')
          .insert([storyData]);

        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة قصة النجاح بنجاح' });
      }

      setIsDialogOpen(false);
      setEditingStory(null);
      resetForm();
      fetchStories();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      license_type: '',
      rating: '5',
      review: '',
      pass_date: '',
      image_url: '',
    });
  };

  const openEditDialog = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData({
      name: story.name,
      license_type: story.license_type,
      rating: story.rating.toString(),
      review: story.review,
      pass_date: story.pass_date,
      image_url: story.image_url || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchStories();
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
            <CardTitle>إدارة نتائج الطلاب</CardTitle>
            <CardDescription>إضافة وتعديل وحذف قصص نجاح الطلاب</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingStory(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة قصة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingStory ? 'تعديل قصة نجاح' : 'إضافة قصة نجاح جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الطالب</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license_type">نوع الرخصة</Label>
                  <Input
                    id="license_type"
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                    required
                    placeholder="مثال: B"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">التقييم (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="review">التعليق</Label>
                  <Textarea
                    id="review"
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="pass_date">تاريخ النجاح</Label>
                  <Input
                    id="pass_date"
                    type="date"
                    value={formData.pass_date}
                    onChange={(e) => setFormData({ ...formData, pass_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">رابط الصورة (اختياري)</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingStory ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {stories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد قصص نجاح بعد
          </div>
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
                    <TableCell className="font-medium">{story.name}</TableCell>
                    <TableCell>{story.license_type}</TableCell>
                    <TableCell>{'⭐'.repeat(story.rating)}</TableCell>
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
                          {story.is_visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(story)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStory(story.id)}
                        >
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
