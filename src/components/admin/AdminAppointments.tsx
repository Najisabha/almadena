import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Calendar } from 'lucide-react';
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

interface Appointment {
  id: string;
  student_id: string;
  appointment_type: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  instructor_name: string | null;
  location: string | null;
  notes: string | null;
}

const appointmentTypeLabels: Record<string, string> = {
  theory_exam: 'امتحان تيوريا',
  practical_exam: 'امتحان عملي',
  lesson: 'درس قيادة',
  consultation: 'استشارة',
};

const statusLabels: Record<string, string> = {
  scheduled: 'مجدول',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  no_show: 'لم يحضر',
};

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    appointment_type: 'lesson',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: '60',
    instructor_name: '',
    location: '',
    notes: '',
  });

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المواعيد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم التحديث', description: 'تم تحديث حالة الموعد بنجاح' });
      fetchAppointments();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الموعد بنجاح' });
      fetchAppointments();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}`;
      const appointmentData = {
        appointment_type: formData.appointment_type,
        appointment_date: appointmentDateTime,
        duration_minutes: parseInt(formData.duration_minutes),
        instructor_name: formData.instructor_name || null,
        location: formData.location || null,
        notes: formData.notes || null,
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث الموعد بنجاح' });
      } else {
        toast({ 
          title: 'تنبيه', 
          description: 'يجب ربط الموعد بطالب معين. هذه الميزة ستكون متاحة قريباً.',
          variant: 'destructive'
        });
        return;
      }

      setIsDialogOpen(false);
      setEditingAppointment(null);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      appointment_type: 'lesson',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: '60',
      instructor_name: '',
      location: '',
      notes: '',
    });
  };

  const openEditDialog = (appointment: Appointment) => {
    const date = new Date(appointment.appointment_date);
    setEditingAppointment(appointment);
    setFormData({
      appointment_type: appointment.appointment_type,
      appointment_date: format(date, 'yyyy-MM-dd'),
      appointment_time: format(date, 'HH:mm'),
      duration_minutes: appointment.duration_minutes.toString(),
      instructor_name: appointment.instructor_name || '',
      location: appointment.location || '',
      notes: appointment.notes || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchAppointments();
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
            <CardTitle>إدارة المواعيد</CardTitle>
            <CardDescription>جدولة وإدارة مواعيد الطلاب</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingAppointment(null); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة موعد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAppointment ? 'تعديل موعد' : 'إضافة موعد جديد'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="appointment_type">نوع الموعد</Label>
                  <Select
                    value={formData.appointment_type}
                    onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory_exam">امتحان تيوريا</SelectItem>
                      <SelectItem value="practical_exam">امتحان عملي</SelectItem>
                      <SelectItem value="lesson">درس قيادة</SelectItem>
                      <SelectItem value="consultation">استشارة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointment_date">التاريخ</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointment_time">الوقت</Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      required
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instructor_name">اسم المدرب</Label>
                  <Input
                    id="instructor_name"
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingAppointment ? 'تحديث' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            لا توجد مواعيد مجدولة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع الموعد</TableHead>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">المدرب</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointmentTypeLabels[appointment.appointment_type] || appointment.appointment_type}
                    </TableCell>
                    <TableCell>
                      {format(new Date(appointment.appointment_date), 'PPp', { locale: ar })}
                    </TableCell>
                    <TableCell>{appointment.duration_minutes} دقيقة</TableCell>
                    <TableCell>{appointment.instructor_name || '-'}</TableCell>
                    <TableCell>{appointment.location || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.status === 'completed'
                            ? 'default'
                            : appointment.status === 'cancelled'
                            ? 'destructive'
                            : appointment.status === 'no_show'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {statusLabels[appointment.status] || appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAppointment(appointment.id)}
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
