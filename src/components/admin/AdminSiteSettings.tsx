import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api as apiClient } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, Mail, MapPin, MessageCircle, DollarSign, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LICENSE_REQUIREMENTS_CONFIG_KEY } from "@/lib/licenseRequirementsDefaults";

type Setting = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
};

const MANAGED_CONTACT_SETTINGS: {
  key: string;
  setting_type: string;
  description: string;
}[] = [
  { key: "site_phone", setting_type: "phone", description: "رقم هاتف المدرسة" },
  { key: "whatsapp_number", setting_type: "phone", description: "رقم واتساب" },
  { key: "site_email", setting_type: "email", description: "البريد الإلكتروني" },
  { key: "site_address", setting_type: "text", description: "عنوان المدرسة" },
  { key: "facebook_url", setting_type: "url", description: "رابط صفحة فيسبوك" },
  { key: "instagram_url", setting_type: "url", description: "رابط حساب انستغرام" },
];

export const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const protectedSettingKeys = useMemo(
    () => new Set(["navbar_config", "signup_places", LICENSE_REQUIREMENTS_CONFIG_KEY]),
    []
  );

  const fetchSettings = useCallback(async () => {
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
        settingsMap[setting.setting_key] = setting.setting_value || "";
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
  }, [protectedSettingKeys, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const def of MANAGED_CONTACT_SETTINGS) {
        const setting_value = settings[def.key] ?? "";
        const { data: existing, error: selErr } = await apiClient
          .from("site_settings")
          .select("id")
          .eq("setting_key", def.key)
          .maybeSingle();

        if (selErr) throw selErr;

        if (existing) {
          const { error } = await apiClient
            .from("site_settings")
            .update({ setting_value })
            .eq("setting_key", def.key);
          if (error) throw error;
        } else {
          const { error } = await apiClient.from("site_settings").insert([
            {
              setting_key: def.key,
              setting_value,
              setting_type: def.setting_type,
              description: def.description,
              is_public: true,
            },
          ]);
          if (error) throw error;
        }
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
  }, [fetchSettings]);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اختصارات الإدارة</CardTitle>
          <CardDescription>الوصول السريع إلى أقسام أخرى من لوحة التحكم</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/admin/pricing">
              <DollarSign className="h-4 w-4" />
              الأسعار
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/admin/places">
              <MapPin className="h-4 w-4" />
              إدارة الأماكن
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/admin/license-requirements">
              <IdCard className="h-4 w-4" />
              متطلبات الرخصة
            </Link>
          </Button>
        </CardContent>
      </Card>

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
                value={settings["site_phone"] || ""}
                onChange={(e) => updateSetting("site_phone", e.target.value)}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                رقم واتساب
              </Label>
              <Input
                id="whatsapp_number"
                value={settings["whatsapp_number"] || ""}
                onChange={(e) => updateSetting("whatsapp_number", e.target.value)}
                placeholder="أدخل رقم واتساب مع رمز الدولة"
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
                value={settings["site_email"] || ""}
                onChange={(e) => updateSetting("site_email", e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Input
                id="site_address"
                value={settings["site_address"] || ""}
                onChange={(e) => updateSetting("site_address", e.target.value)}
                placeholder="أدخل العنوان"
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
                value={settings["facebook_url"] || ""}
                onChange={(e) => updateSetting("facebook_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">رابط انستغرام</Label>
              <Input
                id="instagram_url"
                value={settings["instagram_url"] || ""}
                onChange={(e) => updateSetting("instagram_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="ml-2 h-4 w-4" />
          {isSaving ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
        </Button>
      </div>
    </div>
  );
};
