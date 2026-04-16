import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { AdminLicenseRequirementsEditor } from "@/components/admin/AdminLicenseRequirementsEditor";
import { api as apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LICENSE_REQUIREMENTS_CONFIG_KEY,
  defaultLicenseRequirementsConfig,
  mergeLicenseRequirementsLicenses,
  parseLicenseRequirementsConfig,
  type LicenseCatalogRow,
  type LicenseRequirementsConfig,
} from "@/lib/licenseRequirementsDefaults";
import { ExternalLink, Save, ArrowRight, IdCard } from "lucide-react";

type Setting = {
  setting_key: string;
  setting_value: string | null;
};

function cloneLicenseConfig(): LicenseRequirementsConfig {
  return JSON.parse(JSON.stringify(defaultLicenseRequirementsConfig)) as LicenseRequirementsConfig;
}

const AdminLicenseRequirementsPage = () => {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<LicenseRequirementsConfig>(() => cloneLicenseConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [licenseCatalogMode, setLicenseCatalogMode] = useState(false);
  const [licenseCatalogRows, setLicenseCatalogRows] = useState<LicenseCatalogRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient
        .from("site_settings")
        .select("setting_key, setting_value")
        .order("setting_key");

      if (error) throw error;

      let licenseRaw: string | null = null;
      (data as Setting[] | null)?.forEach((row) => {
        if (row.setting_key === LICENSE_REQUIREMENTS_CONFIG_KEY) {
          licenseRaw = row.setting_value;
        }
      });

      const parsed = parseLicenseRequirementsConfig(licenseRaw);

      const { data: licData, error: licErr } = await apiClient
        .from("licenses")
        .select("id, name_ar, code, icon_url, bg_color")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!licErr && Array.isArray(licData)) {
        const catalog = licData as LicenseCatalogRow[];
        setLicenseCatalogMode(true);
        setLicenseCatalogRows(catalog);
        setConfig({
          ...parsed,
          licenses: mergeLicenseRequirementsLicenses(catalog, parsed.licenses),
        });
      } else {
        setLicenseCatalogMode(false);
        setLicenseCatalogRows([]);
        setConfig(parsed);
      }
      setDirty(false);
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر تحميل إعدادات متطلبات الرخصة",
        variant: "destructive",
      });
      setLicenseCatalogMode(false);
      setLicenseCatalogRows([]);
      setConfig(cloneLicenseConfig());
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/");
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const upsert = async (setting_value: string) => {
    const { data: existing, error: selErr } = await apiClient
      .from("site_settings")
      .select("id")
      .eq("setting_key", LICENSE_REQUIREMENTS_CONFIG_KEY)
      .maybeSingle();

    if (selErr) throw selErr;

    if (existing) {
      const { error } = await apiClient
        .from("site_settings")
        .update({ setting_value })
        .eq("setting_key", LICENSE_REQUIREMENTS_CONFIG_KEY);
      if (error) throw error;
    } else {
      const { error } = await apiClient.from("site_settings").insert([
        {
          setting_key: LICENSE_REQUIREMENTS_CONFIG_KEY,
          setting_value,
          setting_type: "json",
          description: "محتوى صفحة متطلبات الرخصة",
          is_public: true,
        },
      ]);
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert(JSON.stringify(config));
      if (licenseCatalogMode) {
        const { data: licData, error: licErr } = await apiClient
          .from("licenses")
          .select("id, name_ar, code, icon_url, bg_color")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (!licErr && Array.isArray(licData)) {
          setLicenseCatalogRows(licData as LicenseCatalogRow[]);
        }
      }
      setDirty(false);
      toast({ title: "تم الحفظ", description: "تم تحديث صفحة متطلبات الرخصة للزوار." });
    } catch (e) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "تعذر الحفظ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onConfigChange = (next: LicenseRequirementsConfig) => {
    setConfig(next);
    setDirty(true);
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-muted/30 pb-28" dir="rtl">
        <div className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <IdCard className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">متطلبات الرخصة</h1>
                  <p className="mt-1 max-w-xl text-muted-foreground text-sm leading-relaxed">
                    حرّر المحتوى الذي يظهر في الصفحة العامة. التصميم بسيط: تبويبات واضحة وحفظ واحد في الأسفل.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <Link to="/license-requirements" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        معاينة الصفحة
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
                      <Link to="/admin/settings">
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        إعدادات الموقع
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20 text-muted-foreground">جاري تحميل البيانات...</div>
          ) : (
            <AdminLicenseRequirementsEditor
              value={config}
              onChange={onConfigChange}
              licenseCatalogMode={licenseCatalogMode}
              licenseCatalogRows={licenseCatalogMode ? licenseCatalogRows : undefined}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
            <p className="text-sm text-muted-foreground">
              {dirty ? "لديك تغييرات لم تُحفظ بعد." : "كل التغييرات محفوظة."}
            </p>
            <Button size="lg" onClick={handleSave} disabled={saving || loading || !dirty} className="min-w-[160px]">
              <Save className="ml-2 h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLicenseRequirementsPage;
