import { useState, useEffect } from 'react';
import { api as apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

interface Student {
  id: string;
  user_id: string;
  theory_score: number | null;
  practical_score: number | null;
  total_exams_taken: number;
  last_exam_date: string | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string | null;
    license_type: string | null;
  };
}

export const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
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
    try {
      // Fetch students first
      const { data: studentsData, error: studentsError } = await apiClient
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Then fetch profiles for these students
      if (studentsData && studentsData.length > 0) {
        const userIds = studentsData.map(s => s.user_id);
        const { data: profilesData, error: profilesError } = await apiClient
          .from('profiles')
          .select('id, first_name, last_name, phone, license_type')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Merge the data
        const mergedData = studentsData.map(student => ({
          ...student,
          profiles: profilesData?.find(p => p.id === student.user_id) || {
            first_name: '',
            last_name: '',
            phone: null,
            license_type: null
          }
        }));

        setStudents(mergedData);
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الطلاب',
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
        theory_score: formData.theory_score ? parseInt(formData.theory_score) : null,
        practical_score: formData.practical_score ? parseInt(formData.practical_score) : null,
        notes: formData.notes || null,
      };

      const { error } = await apiClient
        .from('students')
        .update(updateData)
        .eq('id', editingStudent.id);

      if (error) throw error;
      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الطالب بنجاح' });
      setIsDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    try {
      const { error } = await apiClient.from('students').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الطالب بنجاح' });
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
            <CardDescription>عرض وإدارة بيانات جميع الطلاب المسجلين</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا يوجد طلاب مسجلين بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">نوع الرخصة</TableHead>
                  <TableHead className="text-right">علامة التيوريا</TableHead>
                  <TableHead className="text-right">علامة العملي</TableHead>
                  <TableHead className="text-right">عدد الامتحانات</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.profiles?.first_name} {student.profiles?.last_name}
                    </TableCell>
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
                        <Dialog open={isDialogOpen && editingStudent?.id === student.id} onOpenChange={setIsDialogOpen}>
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
                                <Button type="submit">تحديث</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => deleteStudent(student.id)}>
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
