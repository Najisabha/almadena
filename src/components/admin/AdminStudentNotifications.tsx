import { useState, useEffect } from 'react';
import { api as apiClient, AdminStudent } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send } from 'lucide-react';

export const AdminStudentNotifications = () => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoadingStudents(true);
    apiClient
      .getAdminStudentsList()
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        setStudents(data ?? []);
      })
      .catch(() => {
        toast({
          title: 'خطأ',
          description: 'فشل تحميل قائمة الطلاب',
          variant: 'destructive',
        });
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  const handleSend = async () => {
    if (!selectedUserId) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار طالب أولاً', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى كتابة نص الإشعار', variant: 'destructive' });
      return;
    }

    setSending(true);
    const { error } = await apiClient.sendAdminNotification(selectedUserId, message);
    setSending(false);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الإرسال', description: 'تم إرسال الإشعار إلى الطالب بنجاح' });
      setMessage('');
      setSelectedUserId('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>إرسال إشعار للطالب</CardTitle>
        </div>
        <CardDescription>
          اختر طالباً وأرسل له رسالة مباشرة تظهر في لوحة التحكم الخاصة به
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="student-select">الطالب</Label>
          {loadingStudents ? (
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون بعد</p>
          ) : (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="student-select">
                <SelectValue placeholder="اختر طالباً..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => {
                  const label = [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
                  const primary = label || s.id_number || s.user_id.slice(0, 8);
                  const roleSuffix = s.is_admin ? ' (مشرف)' : '';
                  return (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {primary}
                      {roleSuffix}
                      {s.license_type ? ` — ${s.license_type}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notif-message">نص الإشعار</Label>
          <Textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك للطالب هنا..."
            rows={4}
            dir="rtl"
          />
        </div>

        <Button onClick={handleSend} disabled={sending || loadingStudents} className="gap-2">
          <Send className="h-4 w-4" />
          {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </Button>
      </CardContent>
    </Card>
  );
};
