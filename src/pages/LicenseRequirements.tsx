import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Truck,
  TramFront,
  Bike,
  Tractor,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { api as apiClient } from "@/integrations/api/client";
import {
  LICENSE_REQUIREMENTS_CONFIG_KEY,
  mergeLicenseRequirementsLicenses,
  parseLicenseRequirementsConfig,
  firstIntFromHoursLabel,
  type LicenseCatalogRow,
  type LicenseRequirementsConfig,
  type LicenseReqLicense,
} from "@/lib/licenseRequirementsDefaults";
import { cn } from "@/lib/utils";
import {
  LicenseCatalogIconBox,
  resolveImageUrl,
  isLikelyHexColor,
  getLicenseTileBgClassByCode,
} from "@/components/license/LicenseCatalogIconBox";

const ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  truck: Truck,
  tram: TramFront,
  bike: Bike,
  tractor: Tractor,
};

function FallbackLicenseIconBox({ iconKey, colorClass }: { iconKey: string; colorClass: string }) {
  const Icon = ICON_MAP[iconKey] || Car;
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-inner text-white sm:h-16 sm:w-16",
        colorClass
      )}
    >
      <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
    </div>
  );
}

const LicenseRequirements = () => {
  const [config, setConfig] = useState<LicenseRequirementsConfig | null>(null);
  const [licenseCatalogById, setLicenseCatalogById] = useState<Record<string, LicenseCatalogRow>>({});
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [{ data, error }, licRes] = await Promise.all([
          apiClient
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", LICENSE_REQUIREMENTS_CONFIG_KEY)
            .maybeSingle(),
          apiClient
            .from("licenses")
            .select("id, name_ar, code, icon_url, bg_color")
            .eq("is_active", true)
            .order("display_order", { ascending: true }),
        ]);

        if (cancelled) return;

        const parsed = error
          ? parseLicenseRequirementsConfig(null)
          : parseLicenseRequirementsConfig(
              (data as { setting_value?: string | null } | null)?.setting_value ?? null
            );

        const licErr = licRes.error;
        const licData = licRes.data;
        if (!licErr && Array.isArray(licData)) {
          const catalog = licData as LicenseCatalogRow[];
          const byId: Record<string, LicenseCatalogRow> = {};
          for (const row of catalog) {
            if (row.id) byId[String(row.id)] = row;
          }
          setLicenseCatalogById(byId);
          setConfig({
            ...parsed,
            licenses: mergeLicenseRequirementsLicenses(catalog, parsed.licenses),
          });
        } else {
          setLicenseCatalogById({});
          setConfig(parsed);
        }
      } catch {
        if (!cancelled) {
          setLicenseCatalogById({});
          setConfig(parseLicenseRequirementsConfig(null));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const n = config?.licenses.length ?? 0;
    if (n === 0) {
      setSelectedLicenseIndex(null);
      return;
    }
    setSelectedLicenseIndex((prev) => {
      if (prev === null) return null;
      if (prev >= n) return n - 1;
      return prev;
    });
  }, [config?.licenses.length]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="text-center text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  const selectedLicense: LicenseReqLicense | null =
    selectedLicenseIndex !== null ? (config.licenses[selectedLicenseIndex] ?? null) : null;

  function renderLicenseDetails(license: LicenseReqLicense) {
    const theoryN = firstIntFromHoursLabel(license.theoryHours);
    const practicalN = firstIntFromHoursLabel(license.practicalHours);
    const totalHours = theoryN + practicalN;
    const vid = license.licenseId != null ? String(license.licenseId) : "";
    const catalogRow = vid ? licenseCatalogById[vid] : undefined;

    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-elevated transition-all duration-300 max-w-6xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
          <div className="flex items-center gap-4">
            {catalogRow ? (
              <LicenseCatalogIconBox
                variant="preview"
                iconUrl={resolveImageUrl(catalogRow.icon_url)}
                bgHex={
                  catalogRow.bg_color && isLikelyHexColor(catalogRow.bg_color)
                    ? catalogRow.bg_color.trim()
                    : null
                }
                tileBgClass={getLicenseTileBgClassByCode(catalogRow.code ?? "")}
                licenseCode={catalogRow.code ?? ""}
              />
            ) : (
              <FallbackLicenseIconBox iconKey={license.iconKey} colorClass={license.color} />
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl">{license.type}</CardTitle>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>الحد الأدنى للعمر: {license.minAge}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>المدة: {license.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                المتطلبات والشروط
              </h3>
              <ul className="space-y-3">
                {license.requirements
                  .filter((r) => r.trim())
                  .map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                <h4 className="font-semibold text-foreground mb-3 text-center">ساعات التدريب</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نظري:</span>
                    <Badge variant="outline">{license.theoryHours}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">عملي:</span>
                    <Badge variant="outline">{license.practicalHours}</Badge>
                  </div>
                  <div className="pt-3 border-t border-border/30">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-foreground">الإجمالي:</span>
                      <Badge className="bg-primary">{totalHours} ساعة</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <p className="text-xs text-center text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline-block ml-1" />
                  المدة التقريبية: {license.duration}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{config.heroBadge}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {config.heroTitleBefore}
              <span className="text-primary">{config.heroTitleAccent}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{config.heroSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{config.stepsSectionTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {config.steps.map((item, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-bl-full"></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-button">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{config.licensesSectionTitle}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 max-w-6xl mx-auto">
            {config.licenses.map((license, index) => {
              const vid = license.licenseId != null ? String(license.licenseId) : "";
              const catalogRow = vid ? licenseCatalogById[vid] : undefined;
              const subtitle = [license.minAge, license.duration].filter(Boolean).join(" · ") || "—";
              const isSelected = selectedLicenseIndex === index;
              return (
                <button
                  key={license.licenseId ?? index}
                  type="button"
                  onClick={() =>
                    setSelectedLicenseIndex((prev) => (prev === index ? null : index))
                  }
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex aspect-square max-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-3 text-center shadow-sm transition",
                    "hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected ? "border-primary ring-2 ring-primary/25" : "border-border/60"
                  )}
                >
                  {catalogRow ? (
                    <LicenseCatalogIconBox
                      iconUrl={resolveImageUrl(catalogRow.icon_url)}
                      bgHex={
                        catalogRow.bg_color && isLikelyHexColor(catalogRow.bg_color)
                          ? catalogRow.bg_color.trim()
                          : null
                      }
                      tileBgClass={getLicenseTileBgClassByCode(catalogRow.code ?? "")}
                      licenseCode={catalogRow.code ?? ""}
                    />
                  ) : (
                    <FallbackLicenseIconBox iconKey={license.iconKey} colorClass={license.color} />
                  )}
                  <span className="line-clamp-2 w-full text-xs font-semibold leading-tight text-foreground sm:text-sm">
                    {license.type.trim() || `نوع رخصة ${index + 1}`}
                  </span>
                  <span className="line-clamp-2 w-full text-[10px] text-muted-foreground sm:text-xs">
                    {subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedLicense && (
            <div className="mt-8">{renderLicenseDetails(selectedLicense)}</div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">{config.ctaTitle}</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">{config.ctaDescription}</p>
              {config.ctaHref.startsWith("/") ? (
                <Link
                  to={config.ctaHref}
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
                >
                  {config.ctaButtonText}
                  <CheckCircle2 className="h-5 w-5" />
                </Link>
              ) : (
                <a
                  href={config.ctaHref}
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
                >
                  {config.ctaButtonText}
                  <CheckCircle2 className="h-5 w-5" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LicenseRequirements;
