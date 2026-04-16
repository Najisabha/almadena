import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LICENSE_REQ_ICON_KEYS,
  type LicenseCatalogRow,
  type LicenseRequirementsConfig,
  type LicenseReqLicense,
  type LicenseReqStep,
} from "@/lib/licenseRequirementsDefaults";
import {
  Bike,
  Car,
  Plus,
  Tractor,
  TramFront,
  Truck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LicenseCatalogIconBox,
  resolveImageUrl,
  isLikelyHexColor,
  getLicenseTileBgClassByCode,
} from "@/components/license/LicenseCatalogIconBox";

const ICON_LABELS: Record<string, string> = {
  car: "سيارة",
  truck: "شاحنة",
  tram: "أجرة",
  bike: "دراجة نارية",
  tractor: "معدات / تراكتور",
};

const LICENSE_ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  truck: Truck,
  tram: TramFront,
  bike: Bike,
  tractor: Tractor,
};

const COLOR_PRESETS = [
  { className: "bg-blue-500", label: "أزرق" },
  { className: "bg-orange-500", label: "برتقالي" },
  { className: "bg-yellow-500", label: "أصفر" },
  { className: "bg-red-500", label: "أحمر" },
  { className: "bg-green-500", label: "أخضر" },
  { className: "bg-purple-500", label: "بنفسجي" },
];

function resolveCatalogRow(
  catalog: LicenseCatalogRow[] | undefined,
  index: number,
  lic: LicenseReqLicense
): LicenseCatalogRow | undefined {
  if (!catalog?.length) return undefined;
  if (lic.licenseId) {
    const byId = catalog.find((r) => r.id === lic.licenseId);
    if (byId) return byId;
  }
  return catalog[index];
}

type Props = {
  value: LicenseRequirementsConfig;
  onChange: (next: LicenseRequirementsConfig) => void;
  /** عند true: قائمة الأنواع من جدول licenses فقط — لا إضافة/حذف من هنا */
  licenseCatalogMode?: boolean;
  /** صفوف الكتالوج من API (icon_url، bg_color) لعرض ديناميكي في وضع الكتالوج */
  licenseCatalogRows?: LicenseCatalogRow[];
};

export function AdminLicenseRequirementsEditor({
  value,
  onChange,
  licenseCatalogMode = false,
  licenseCatalogRows,
}: Props) {
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState<number | null>(null);

  useEffect(() => {
    const n = value.licenses.length;
    if (n === 0) {
      setSelectedLicenseIndex(null);
      return;
    }
    setSelectedLicenseIndex((prev) => {
      if (prev === null) return 0;
      if (prev >= n) return n - 1;
      return prev;
    });
  }, [value.licenses.length]);

  const patch = (partial: Partial<LicenseRequirementsConfig>) =>
    onChange({ ...value, ...partial });

  const setSteps = (steps: LicenseReqStep[]) => patch({ steps });
  const setLicenses = (licenses: LicenseReqLicense[]) => patch({ licenses });

  const updateStep = (index: number, partial: Partial<LicenseReqStep>) => {
    setSteps(value.steps.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  };

  const removeStep = (index: number) => {
    setSteps(value.steps.filter((_, i) => i !== index));
  };

  const addStep = () => {
    const n = value.steps.length + 1;
    setSteps([...value.steps, { step: String(n), title: "", description: "" }]);
  };

  const updateLicense = (index: number, partial: Partial<LicenseReqLicense>) => {
    setLicenses(value.licenses.map((l, i) => (i === index ? { ...l, ...partial } : l)));
  };

  const addLicense = () => {
    setLicenses([
      ...value.licenses,
      {
        licenseId: null,
        type: "",
        iconKey: "car",
        color: "bg-blue-500",
        minAge: "",
        requirements: [""],
        duration: "",
        theoryHours: "",
        practicalHours: "",
      },
    ]);
  };

  const removeLicense = (index: number) => {
    setLicenses(value.licenses.filter((_, i) => i !== index));
  };

  const requirementsText = (lic: LicenseReqLicense) =>
    lic.requirements.length ? lic.requirements.join("\n") : "";

  const setRequirementsFromText = (li: number, text: string) => {
    const lines = text.split("\n").map((l) => l.trim());
    const nonEmpty = lines.filter((l) => l.length > 0);
    updateLicense(li, { requirements: nonEmpty.length ? nonEmpty : [""] });
  };

  return (
    <Tabs defaultValue="intro" className="w-full space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/80 p-1 md:grid-cols-4 md:gap-0">
        <TabsTrigger value="intro" className="rounded-lg data-[state=active]:shadow-sm">
          المقدمة
        </TabsTrigger>
        <TabsTrigger value="steps" className="rounded-lg data-[state=active]:shadow-sm">
          الخطوات
        </TabsTrigger>
        <TabsTrigger value="licenses" className="rounded-lg data-[state=active]:shadow-sm">
          أنواع الرخص
        </TabsTrigger>
        <TabsTrigger value="cta" className="rounded-lg data-[state=active]:shadow-sm">
          أسفل الصفحة
        </TabsTrigger>
      </TabsList>

      <TabsContent value="intro" className="mt-0 outline-none">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">عنوان الصفحة والوصف</CardTitle>
            <CardDescription>ما يظهر في أعلى الصفحة للزائر قبل قوائم الخطوات والرخص</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lr_badge">شارة صغيرة فوق العنوان</Label>
              <Input
                id="lr_badge"
                value={value.heroBadge}
                onChange={(e) => patch({ heroBadge: e.target.value })}
                className="text-right max-w-md"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lr_t1">جزء العنوان الرئيسي</Label>
                <Input
                  id="lr_t1"
                  value={value.heroTitleBefore}
                  onChange={(e) => patch({ heroTitleBefore: e.target.value })}
                  className="text-right"
                  placeholder="مثال: متطلبات "
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr_t2">كلمة مميّزة بلون أساسي</Label>
                <Input
                  id="lr_t2"
                  value={value.heroTitleAccent}
                  onChange={(e) => patch({ heroTitleAccent: e.target.value })}
                  className="text-right"
                  placeholder="مثال: الرخص"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lr_sub">وصف قصير تحت العنوان</Label>
              <Textarea
                id="lr_sub"
                value={value.heroSubtitle}
                onChange={(e) => patch({ heroSubtitle: e.target.value })}
                className="text-right min-h-[88px] resize-y"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 border-t pt-5">
              <div className="space-y-2">
                <Label htmlFor="lr_st">عنوان قسم الخطوات</Label>
                <Input
                  id="lr_st"
                  value={value.stepsSectionTitle}
                  onChange={(e) => patch({ stepsSectionTitle: e.target.value })}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr_lt">عنوان قسم أنواع الرخص</Label>
                <Input
                  id="lr_lt"
                  value={value.licensesSectionTitle}
                  onChange={(e) => patch({ licensesSectionTitle: e.target.value })}
                  className="text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="steps" className="mt-0 outline-none">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">خطوات الحصول على الرخصة</CardTitle>
              <CardDescription>رقم، عنوان قصير، وشرح بسيط لكل خطوة</CardDescription>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addStep} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              إضافة خطوة
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {value.steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background p-4 sm:flex-row sm:items-end"
              >
                <div className="grid flex-1 gap-3 sm:grid-cols-12">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">الرقم</Label>
                    <Input
                      value={step.step}
                      onChange={(e) => updateStep(index, { step: e.target.value })}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-4">
                    <Label className="text-xs text-muted-foreground">العنوان</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, { title: e.target.value })}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-6">
                    <Label className="text-xs text-muted-foreground">الوصف</Label>
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(index, { description: e.target.value })}
                      className="text-right"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeStep(index)}
                  aria-label="حذف الخطوة"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="licenses" className="mt-0 outline-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-md">
            {licenseCatalogMode
              ? "الأيقونة من إدارة الرخص. لون المربع: إن وُجد لون داكن في قاعدة البيانات يُطبَّق، وإلا ألوان ثابتة حسب رمز الرخصة. اختر مربعاً لتعديل المتطلبات والمدة والساعات."
              : "اختر مربعاً لبدء التعديل. المتطلبات: سطر واحد لكل بند في المربع النصي."}
          </p>
          {!licenseCatalogMode && (
            <Button type="button" variant="secondary" size="sm" onClick={addLicense} className="gap-1">
              <Plus className="h-4 w-4" />
              إضافة نوع رخصة
            </Button>
          )}
        </div>

        {licenseCatalogMode && value.licenses.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            لا توجد رخص نشطة في النظام. أضف أنواع الرخص من{" "}
            <Link to="/admin/licenses" className="font-medium text-primary underline-offset-4 hover:underline">
              إدارة الرخص
            </Link>
            .
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {value.licenses.map((lic, li) => {
            const catalogRow =
              licenseCatalogMode && licenseCatalogRows
                ? resolveCatalogRow(licenseCatalogRows, li, lic)
                : undefined;
            const dbIconUrl = catalogRow ? resolveImageUrl(catalogRow.icon_url) : "";
            const dbBg =
              catalogRow?.bg_color && isLikelyHexColor(catalogRow.bg_color)
                ? catalogRow.bg_color.trim()
                : null;
            const Icon = LICENSE_ICON_MAP[lic.iconKey] ?? Car;
            const subtitle = [lic.minAge, lic.duration].filter(Boolean).join(" · ") || "—";
            const isSelected = selectedLicenseIndex === li;
            return (
              <button
                key={lic.licenseId ?? li}
                type="button"
                onClick={() => setSelectedLicenseIndex(li)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex aspect-square max-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-3 text-center shadow-sm transition",
                  "hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected ? "border-primary ring-2 ring-primary/25" : "border-border/60"
                )}
              >
                {licenseCatalogMode ? (
                  <LicenseCatalogIconBox
                    iconUrl={dbIconUrl}
                    bgHex={dbBg}
                    tileBgClass={getLicenseTileBgClassByCode(catalogRow?.code ?? "")}
                    licenseCode={catalogRow?.code ?? ""}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-inner sm:h-16 sm:w-16",
                      dbIconUrl ? "p-2" : "text-white",
                      !dbBg && lic.color
                    )}
                    style={dbBg ? { backgroundColor: dbBg } : undefined}
                  >
                    {dbIconUrl ? (
                      <img src={dbIconUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
                    )}
                  </div>
                )}
                <span className="line-clamp-2 w-full text-xs font-semibold leading-tight text-foreground sm:text-sm">
                  {lic.type.trim() || `نوع رخصة ${li + 1}`}
                </span>
                <span className="line-clamp-2 w-full text-[10px] text-muted-foreground sm:text-xs">{subtitle}</span>
              </button>
            );
          })}
        </div>

        {selectedLicenseIndex !== null &&
          (() => {
            const li = selectedLicenseIndex;
            const lic = value.licenses[li];
            if (!lic) return null;
            const catalogRowEdit =
              licenseCatalogMode && licenseCatalogRows
                ? resolveCatalogRow(licenseCatalogRows, li, lic)
                : undefined;
            const previewIconUrl = catalogRowEdit ? resolveImageUrl(catalogRowEdit.icon_url) : "";
            const previewBgHex =
              catalogRowEdit?.bg_color && isLikelyHexColor(catalogRowEdit.bg_color)
                ? catalogRowEdit.bg_color.trim()
                : null;
            return (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-lg">
                    تعديل: {lic.type.trim() || `نوع رخصة ${li + 1}`}
                  </CardTitle>
                  <CardDescription>عدّل الحقول ثم احفظ من شريط الأسفل.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {!licenseCatalogMode && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => removeLicense(li)}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف هذا النوع
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>اسم نوع الرخصة</Label>
                      {licenseCatalogMode ? (
                        <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-right text-sm font-medium">
                          {lic.type.trim() || "—"}
                        </p>
                      ) : (
                        <Input
                          value={lic.type}
                          onChange={(e) => updateLicense(li, { type: e.target.value })}
                          className="text-right"
                        />
                      )}
                    </div>
                    {licenseCatalogMode ? (
                      <div className="space-y-2 md:col-span-2">
                        <Label>الأيقونة واللون (من قاعدة البيانات)</Label>
                        <div className="flex flex-col-reverse items-stretch gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-muted-foreground text-right leading-relaxed">
                            تُحدَّث من{" "}
                            <Link
                              to="/admin/licenses"
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              إدارة الرخص
                            </Link>
                            . بعد التعديل في إدارة الرخص، استخدم «حفظ التغييرات» هنا أو حدّث الصفحة لتحديث المعاينة.
                          </p>
                          <LicenseCatalogIconBox
                            variant="preview"
                            iconUrl={previewIconUrl}
                            bgHex={previewBgHex}
                            tileBgClass={getLicenseTileBgClassByCode(catalogRowEdit?.code ?? "")}
                            licenseCode={catalogRowEdit?.code ?? ""}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>الأيقونة</Label>
                          <Select
                            value={lic.iconKey}
                            onValueChange={(v) =>
                              updateLicense(li, { iconKey: v as LicenseReqLicense["iconKey"] })
                            }
                          >
                            <SelectTrigger className="text-right">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LICENSE_REQ_ICON_KEYS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {ICON_LABELS[k] || k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>لون المربع</Label>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((p) => (
                              <button
                                key={p.className}
                                type="button"
                                title={p.label}
                                onClick={() => updateLicense(li, { color: p.className })}
                                className={cn(
                                  "h-9 w-9 rounded-lg ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  p.className,
                                  lic.color === p.className && "ring-2 ring-primary ring-offset-2"
                                )}
                              />
                            ))}
                          </div>
                          <Input
                            value={lic.color}
                            onChange={(e) => updateLicense(li, { color: e.target.value })}
                            className="text-right font-mono text-xs h-8"
                            placeholder="أو أدخل فئة Tailwind يدوياً"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>الحد الأدنى للعمر</Label>
                      <Input
                        value={lic.minAge}
                        onChange={(e) => updateLicense(li, { minAge: e.target.value })}
                        className="text-right"
                        placeholder="مثال: 18 سنة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المدة التقريبية</Label>
                      <Input
                        value={lic.duration}
                        onChange={(e) => updateLicense(li, { duration: e.target.value })}
                        className="text-right"
                        placeholder="مثال: 2-3 أشهر"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ساعات نظري</Label>
                      <Input
                        value={lic.theoryHours}
                        onChange={(e) => updateLicense(li, { theoryHours: e.target.value })}
                        className="text-right"
                        placeholder="مثال: 28 ساعة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ساعات عملي</Label>
                      <Input
                        value={lic.practicalHours}
                        onChange={(e) => updateLicense(li, { practicalHours: e.target.value })}
                        className="text-right"
                        placeholder="مثال: 28 ساعة"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>المتطلبات (سطر لكل بند)</Label>
                    <Textarea
                      value={requirementsText(lic)}
                      onChange={(e) => setRequirementsFromText(li, e.target.value)}
                      className="text-right min-h-[140px] resize-y font-normal leading-relaxed"
                      placeholder="اكتب كل شرط في سطر منفصل..."
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })()}
      </TabsContent>

      <TabsContent value="cta" className="mt-0 outline-none">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">الدعوة للإجراء</CardTitle>
            <CardDescription>الصندوق الملون في أسفل الصفحة العامة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={value.ctaTitle}
                onChange={(e) => patch({ ctaTitle: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={value.ctaDescription}
                onChange={(e) => patch({ ctaDescription: e.target.value })}
                className="text-right min-h-[88px] resize-y"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نص الزر</Label>
                <Input
                  value={value.ctaButtonText}
                  onChange={(e) => patch({ ctaButtonText: e.target.value })}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>رابط الزر</Label>
                <Input
                  value={value.ctaHref}
                  onChange={(e) => patch({ ctaHref: e.target.value })}
                  className="text-left font-mono text-sm"
                  dir="ltr"
                  placeholder="/contact"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
