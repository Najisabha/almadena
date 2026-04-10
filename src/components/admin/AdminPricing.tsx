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
  is_active: boolean;
}

export const AdminPricing = () => {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    package_name: '',
    package_name_ar: '',
    description: '',
    description_ar: '',
    price: '',
    currency: 'ILS',
    lessons_count: '',
    duration_hours: '',
    license_type: '',
  });

  const fetchPackages = async () => {
    try {
      const { data, error } = await apiClient
        .from('pricing')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الباقات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const packageData = {
        ...formData,
        price: parseFloat(formData.price),
        lessons_count: formData.lessons_count ? parseInt(formData.lessons_count) : null,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
      };

      if (editingPackage) {
        const { error } = await apiClient
          .from('pricing')
          .update(packageData)
          .eq('id', editingPackage.id);
        
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث الباقة بنجاح' });
      } else {
        const { error } = await apiClient
          .from('pricing')
          .insert([packageData]);
        
        if (error) throw error;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة الباقة بنجاح' });
      }
      
      setIsDialogOpen(false);
      setEditingPackage(null);
      resetForm();
      fetchPackages();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      package_name: '',
      package_name_ar: '',
      description: '',
      description_ar: '',
      price: '',
      currency: 'ILS',
      lessons_count: '',
      duration_hours: '',
      license_type: '',
    });
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await apiClient
        .from('pricing')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم التحديث', description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} الباقة` });
      fetchPackages();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      const { error } = await apiClient.from('pricing').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الباقة بنجاح' });
      fetchPackages();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (pkg: PricingPackage) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      package_name_ar: pkg.package_name_ar,
      description: pkg.description || '',
      description_ar: pkg.description_ar || '',
      price: pkg.price.toString(),
      currency: pkg.currency,
      lessons_count: pkg.lessons_count?.toString() || '',
      duration_hours: pkg.duration_hours?.toString() || '',
      license_type: pkg.license_type || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchPackages();
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
            <CardTitle>إدارة الأسعار</CardTitle>
            <CardDescription>إدارة باقات التدريب وأسعارها</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingPackage(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة باقة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="package_name_ar">اسم الباقة (عربي)</Label>
                    <Input
                      id="package_name_ar"
                      value={formData.package_name_ar}
                      onChange={(e) => setFormData({ ...formData, package_name_ar: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="package_name">اسم الباقة (English)</Label>
                    <Input
                      id="package_name"
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description_ar">الوصف (عربي)</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="description">الوصف (English)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">السعر</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lessons_count">عدد الدروس</Label>
                    <Input
                      id="lessons_count"
                      type="number"
                      value={formData.lessons_count}
                      onChange={(e) => setFormData({ ...formData, lessons_count: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_hours">عدد الساعات</Label>
                    <Input
                      id="duration_hours"
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="license_type">نوع الرخصة</Label>
                  <Input
                    id="license_type"
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                    placeholder="مثال: B"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingPackage ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد باقات بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الباقة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">عدد الدروس</TableHead>
                  <TableHead className="text-right">الساعات</TableHead>
                  <TableHead className="text-right">نوع الرخصة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.package_name_ar}</TableCell>
                    <TableCell>{pkg.price} {pkg.currency}</TableCell>
                    <TableCell>{pkg.lessons_count || '-'}</TableCell>
                    <TableCell>{pkg.duration_hours || '-'}</TableCell>
                    <TableCell>{pkg.license_type || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                        {pkg.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(pkg.id, pkg.is_active)}
                        >
                          {pkg.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(pkg)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePackage(pkg.id)}
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
