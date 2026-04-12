import { useState, useEffect } from 'react';
import { api as apiClient, type AdminStudentManagementRow } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
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

type Student = AdminStudentManagementRow;

export const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    theory_score: '',
    practical_score: '',
    notes: '',
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await apiClient.getAdminStudentsManagement();
      if (error) throw new Error(error.message);
      setStudents(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (error: unknown) {
      console.error('Error fetching students:', error);
      const message =
        error instanceof Error ? error.message : 'فشل في تحميل بيانات الطلاب';
      setLoadError(message);
      setStudents([]);
      toast({
        title: 'خطأ',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const updateData = {
        theory_score: formData.theory_score ? parseInt(formData.theory_score, 10) : null,
        practical_score: formData.practical_score ? parseInt(formData.practical_score, 10) : null,
        notes: formData.notes || null,
      };

      if (editingStudent.id) {
        const { error } = await apiClient
          .from('students')
          .update(updateData)
          .eq('id', editingStudent.id);
        if (error) throw error;
      } else {
        const { error } = await apiClient.from('students').insert([
          { user_id: editingStudent.user_id, ...updateData },
        ]);
        if (error) throw error;
      }

      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الطالب بنجاح' });
      setIsDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteStudent = async (studentRowId: string) => {
    if (!confirm('هل أنت متأكد من حذف سجل الطالب (العلامات والامتحانات المرتبطة بالحساب)؟')) return;

    try {
      const { error } = await apiClient.from('students').delete().eq('id', studentRowId);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف سجل الطالب بنجاح' });
      fetchStudents();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      theory_score: student.theory_score?.toString() || '',
      practical_score: student.practical_score?.toString() || '',
      notes: student.notes || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchStudents();
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
            <CardTitle>إدارة الطلاب</CardTitle>
            <CardDescription>جميع المستخدمين بما فيهم المشرفون — يظهر رقم الهوية حتى لو لم يكتمل الملف الشخصي</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-destructive">{loadError}</p>
            <p className="text-sm text-muted-foreground">
              غالباً الخادم يعمل بنسخة قديمة من الـ API. أوقف عملية Node على المنفذ 4000 ثم شغّل من مجلد{' '}
              <code className="text-xs bg-muted px-1 rounded">backend</code>:{' '}
              <code className="text-xs bg-muted px-1 rounded">npm run dev</code>
            </p>
            <Button type="button" variant="outline" onClick={() => void fetchStudents()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا يوجد مستخدمون مسجلون بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">رقم الهوية</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">نوع الرخصة</TableHead>
                  <TableHead className="text-right">علامة التيوريا</TableHead>
                  <TableHead className="text-right">علامة العملي</TableHead>
                  <TableHead className="text-right">عدد الامتحانات</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const displayName = [student.profiles?.first_name, student.profiles?.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                  return (
                  <TableRow key={student.user_id}>
                    <TableCell className="font-medium">
                      {displayName || '—'}
                    </TableCell>
                    <TableCell>
                      {student.is_admin ? (
                        <Badge variant="secondary">مشرف</Badge>
                      ) : (
                        <Badge variant="outline">طالب</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{student.id_number ?? '—'}</TableCell>
                    <TableCell>{student.profiles?.phone || '-'}</TableCell>
                    <TableCell>{student.profiles?.license_type || '-'}</TableCell>
                    <TableCell>
                      {student.theory_score !== null ? student.theory_score : '-'}
                    </TableCell>
                    <TableCell>
                      {student.practical_score !== null ? student.practical_score : '-'}
                    </TableCell>
                    <TableCell>{student.total_exams_taken}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isDialogOpen && editingStudent?.user_id === student.user_id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                              <DialogDescription>
                                تحديث علامات التيوريا والعملي وملاحظات الطالب
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="theory_score">علامة التيوريا</Label>
                                <Input
                                  id="theory_score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={formData.theory_score}
                                  onChange={(e) => setFormData({ ...formData, theory_score: e.target.value })}
                                  placeholder="أدخل علامة التيوريا"
                                />
                              </div>
                              <div>
                                <Label htmlFor="practical_score">علامة العملي</Label>
                                <Input
                                  id="practical_score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={formData.practical_score}
                                  onChange={(e) => setFormData({ ...formData, practical_score: e.target.value })}
                                  placeholder="أدخل علامة العملي"
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">ملاحظات</Label>
                                <Input
                                  id="notes"
                                  value={formData.notes}
                                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                  placeholder="أدخل ملاحظات عن الطالب"
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit">{student.id ? 'تحديث' : 'إنشاء السجل وحفظ'}</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        {student.id ? (
                          <Button variant="outline" size="sm" onClick={() => deleteStudent(student.id!)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
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
