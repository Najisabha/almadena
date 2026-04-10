import { useEffect, useMemo, useState } from "react";
import { api as apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavbarConfig } from "@/features/siteSettings/useNavbarConfig";
import { NavbarSignalsEditor } from "./settings/NavbarSignalsEditor";
import { NotificationBadgeEditor } from "./settings/NotificationBadgeEditor";

type Setting = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
};

export const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navbarConfigState = useNavbarConfig();

  const protectedSettingKeys = useMemo(() => new Set(["navbar_config"]), []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await apiClient
        .from("site_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting: Setting) => {
        if (protectedSettingKeys.has(setting.setting_key)) {
          return;
        }
        settingsMap[setting.setting_key] = setting.setting_value || '';
      });
      setSettings(settingsMap);
    } catch {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error: navbarError } = await navbarConfigState.persist(navbarConfigState.config);
      if (navbarError) {
        throw new Error(navbarError);
      }

      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await apiClient
          .from("site_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "تعذر حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    void fetchSettings();
  }, [protectedSettingKeys]);

  useEffect(() => {
    if (navbarConfigState.warning) {
      toast({
        title: "تنبيه",
        description: navbarConfigState.warning,
      });
    }
  }, [navbarConfigState.warning, toast]);

  if (isLoading || navbarConfigState.isLoading) {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات الاتصال</CardTitle>
          <CardDescription>تعديل أرقام الهواتف والبريد الإلكتروني والعنوان</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </Label>
              <Input
                id="site_phone"
                value={settings['site_phone'] || ''}
                onChange={(e) => updateSetting('site_phone', e.target.value)}
                placeholder="050-1234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                رقم واتساب
              </Label>
              <Input
                id="whatsapp_number"
                value={settings['whatsapp_number'] || ''}
                onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
                placeholder="972501234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="site_email"
                type="email"
                value={settings['site_email'] || ''}
                onChange={(e) => updateSetting('site_email', e.target.value)}
                placeholder="info@almadina-academy.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Input
                id="site_address"
                value={settings['site_address'] || ''}
                onChange={(e) => updateSetting('site_address', e.target.value)}
                placeholder="المدينة، فلسطين"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>روابط وسائل التواصل الاجتماعي</CardTitle>
          <CardDescription>روابط صفحات فيسبوك وانستغرام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">رابط فيسبوك</Label>
              <Input
                id="facebook_url"
                value={settings['facebook_url'] || ''}
                onChange={(e) => updateSetting('facebook_url', e.target.value)}
                placeholder="https://facebook.com/almadina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">رابط انستغرام</Label>
              <Input
                id="instagram_url"
                value={settings['instagram_url'] || ''}
                onChange={(e) => updateSetting('instagram_url', e.target.value)}
                placeholder="https://instagram.com/almadina"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات عناصر النافبار</CardTitle>
          <CardDescription>تحكم كامل بعناصر القائمة وروابط الاستعلام والترتيب والإظهار</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <NavbarSignalsEditor
            title="عناصر القائمة الرئيسية"
            kind="menu"
            items={navbarConfigState.config.items}
            onChange={(items) => navbarConfigState.setConfig({ ...navbarConfigState.config, items })}
          />
          <NavbarSignalsEditor
            title="عناصر الاستعلام"
            kind="inquiry"
            items={navbarConfigState.config.items}
            onChange={(items) => navbarConfigState.setConfig({ ...navbarConfigState.config, items })}
          />
          <NotificationBadgeEditor
            badge={navbarConfigState.config.badge}
            onChange={(badge) => navbarConfigState.setConfig({ ...navbarConfigState.config, badge })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="ml-2 h-4 w-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
        </Button>
      </div>
    </div>
  );
};
