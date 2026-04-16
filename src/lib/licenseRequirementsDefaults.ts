export const LICENSE_REQUIREMENTS_CONFIG_KEY = "license_requirements_config";

export type LicenseReqIconKey = "car" | "truck" | "tram" | "bike" | "tractor";

export const LICENSE_REQ_ICON_KEYS: LicenseReqIconKey[] = [
  "car",
  "truck",
  "tram",
  "bike",
  "tractor",
];

export interface LicenseReqStep {
  step: string;
  title: string;
  description: string;
}

export interface LicenseReqLicense {
  /** UUID من جدول licenses عند الربط بالكتالوج */
  licenseId: string | null;
  type: string;
  iconKey: LicenseReqIconKey;
  color: string;
  minAge: string;
  requirements: string[];
  duration: string;
  theoryHours: string;
  practicalHours: string;
}

/** صف من جدول licenses للدمج مع إعدادات متطلبات الرخصة */
export type LicenseCatalogRow = {
  id: string;
  name_ar: string;
  icon_url?: string | null;
  code?: string | null;
  bg_color?: string | null;
};

export interface LicenseRequirementsConfig {
  heroBadge: string;
  heroTitleBefore: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  stepsSectionTitle: string;
  licensesSectionTitle: string;
  steps: LicenseReqStep[];
  licenses: LicenseReqLicense[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
  ctaHref: string;
}

export const defaultLicenseRequirementsConfig: LicenseRequirementsConfig = {
  heroBadge: "معلومات شاملة",
  heroTitleBefore: "متطلبات ",
  heroTitleAccent: "الرخص",
  heroSubtitle:
    "تعرف على المتطلبات والشروط اللازمة للحصول على رخصة القيادة بمختلف أنواعها",
  stepsSectionTitle: "خطوات الحصول على الرخصة",
  licensesSectionTitle: "أنواع الرخص ومتطلباتها",
  steps: [
    {
      step: "1",
      title: "التسجيل في الأكاديمية",
      description: "قم بالتسجيل وتقديم المستندات المطلوبة",
    },
    {
      step: "2",
      title: "الدورة النظرية",
      description: "احضر المحاضرات النظرية وادرس قوانين المرور",
    },
    {
      step: "3",
      title: "الفحص النظري (التووريا)",
      description: "اجتاز امتحان التووريا بنجاح",
    },
    {
      step: "4",
      title: "التدريب العملي",
      description: "ابدأ التدريب العملي على القيادة",
    },
    {
      step: "5",
      title: "الفحص العملي",
      description: "اجتاز الفحص العملي في قسم المرور",
    },
    {
      step: "6",
      title: "استلام الرخصة",
      description: "احصل على رخصة القيادة الخاصة بك",
    },
  ],
  licenses: [
    {
      licenseId: null,
      type: "رخصة خاصة",
      iconKey: "car",
      color: "bg-blue-500",
      minAge: "18 سنة",
      requirements: [
        "بطاقة هوية وطنية سارية المفعول",
        "فحص طبي من مركز معتمد",
        "صور شخصية حديثة (4×6)",
        "اجتياز الفحص النظري (التووريا)",
        "اجتياز الفحص العملي",
        "دفع الرسوم المقررة",
      ],
      duration: "2-3 أشهر",
      theoryHours: "28 ساعة",
      practicalHours: "28 ساعة",
    },
    {
      licenseId: null,
      type: "رخصة شاحنة",
      iconKey: "truck",
      color: "bg-orange-500",
      minAge: "20 سنة",
      requirements: [
        "الحصول على رخصة خاصة لمدة سنتين على الأقل",
        "بطاقة هوية وطنية سارية المفعول",
        "فحص طبي شامل من مركز معتمد",
        "صور شخصية حديثة (4×6)",
        "اجتياز الفحص النظري الخاص بالشاحنات",
        "اجتياز الفحص العملي على شاحنة",
        "شهادة حسن سيرة وسلوك",
        "دفع الرسوم المقررة",
      ],
      duration: "3-4 أشهر",
      theoryHours: "40 ساعة",
      practicalHours: "50 ساعة",
    },
    {
      licenseId: null,
      type: "رخصة أجرة (تاكسي)",
      iconKey: "tram",
      color: "bg-yellow-500",
      minAge: "21 سنة",
      requirements: [
        "الحصول على رخصة خاصة لمدة 3 سنوات على الأقل",
        "بطاقة هوية وطنية سارية المفعول",
        "فحص طبي شامل",
        "اختبار معرفة الطرق والمواقع",
        "شهادة حسن سيرة وسلوك",
        "صور شخصية حديثة (4×6)",
        "عدم وجود مخالفات مرورية خطيرة",
        "دفع الرسوم المقررة",
      ],
      duration: "2-3 أشهر",
      theoryHours: "35 ساعة",
      practicalHours: "30 ساعة",
    },
    {
      licenseId: null,
      type: "رخصة دراجة نارية",
      iconKey: "bike",
      color: "bg-red-500",
      minAge: "18 سنة",
      requirements: [
        "بطاقة هوية وطنية سارية المفعول",
        "فحص طبي من مركز معتمد",
        "صور شخصية حديثة (4×6)",
        "اجتياز الفحص النظري للدراجات النارية",
        "اجتياز الفحص العملي",
        "خوذة واقية معتمدة",
        "دفع الرسوم المقررة",
      ],
      duration: "1-2 شهر",
      theoryHours: "20 ساعة",
      practicalHours: "20 ساعة",
    },
    {
      licenseId: null,
      type: "رخصة معدات ثقيلة",
      iconKey: "tractor",
      color: "bg-green-500",
      minAge: "21 سنة",
      requirements: [
        "الحصول على رخصة خاصة لمدة سنتين",
        "بطاقة هوية وطنية سارية المفعول",
        "فحص طبي شامل",
        "شهادة تدريب على المعدات الثقيلة",
        "اجتياز الفحص النظري والعملي",
        "صور شخصية حديثة (4×6)",
        "دفع الرسوم المقررة",
      ],
      duration: "3-4 أشهر",
      theoryHours: "45 ساعة",
      practicalHours: "60 ساعة",
    },
  ],
  ctaTitle: "هل أنت مستعد للبدء؟",
  ctaDescription:
    "سجل الآن وابدأ رحلتك للحصول على رخصة القيادة مع أكاديمية المدينة",
  ctaButtonText: "سجل الآن",
  ctaHref: "/contact",
};

function isIconKey(v: string): v is LicenseReqIconKey {
  return LICENSE_REQ_ICON_KEYS.includes(v as LicenseReqIconKey);
}

function normalizeLicense(raw: Partial<LicenseReqLicense>): LicenseReqLicense {
  const iconKey = isIconKey(String(raw.iconKey || "")) ? raw.iconKey! : "car";
  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements.map((r) => String(r ?? "")).filter(Boolean)
    : [];
  const lid = raw.licenseId != null && String(raw.licenseId).trim() ? String(raw.licenseId).trim() : null;
  return {
    licenseId: lid,
    type: String(raw.type ?? ""),
    iconKey,
    color: String(raw.color ?? "bg-blue-500"),
    minAge: String(raw.minAge ?? ""),
    requirements,
    duration: String(raw.duration ?? ""),
    theoryHours: String(raw.theoryHours ?? ""),
    practicalHours: String(raw.practicalHours ?? ""),
  };
}

/**
 * يبني مصفوفة رخص للعرض/الحفظ: ترتيب وأسماء من كتالوج API، محتوى من المحفوظ عند التطابق.
 */
export function mergeLicenseRequirementsLicenses(
  catalogRows: LicenseCatalogRow[],
  savedLicenses: LicenseReqLicense[]
): LicenseReqLicense[] {
  const savedList = savedLicenses.map((l) => normalizeLicense(l));
  const used = new Set<number>();

  const takeUnused = (predicate: (l: LicenseReqLicense, i: number) => boolean): LicenseReqLicense | undefined => {
    const i = savedList.findIndex((l, idx) => !used.has(idx) && predicate(l, idx));
    if (i < 0) return undefined;
    used.add(i);
    return savedList[i];
  };

  return catalogRows.map((row) => {
    const id = String(row.id || "").trim();
    const nameAr = String(row.name_ar ?? "").trim();
    const byId = id
      ? takeUnused((l) => l.licenseId != null && String(l.licenseId).trim() === id)
      : undefined;
    const byName =
      !byId && nameAr
        ? takeUnused((l) => l.type.trim() === nameAr)
        : undefined;
    const byOrder = !byId && !byName ? takeUnused(() => true) : undefined;
    const saved = byId ?? byName ?? byOrder;
    return normalizeLicense({
      ...(saved ?? {}),
      licenseId: id || null,
      type: nameAr,
    });
  });
}

function normalizeStep(raw: Partial<LicenseReqStep>): LicenseReqStep {
  return {
    step: String(raw.step ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
  };
}

function cloneConfig(c: LicenseRequirementsConfig): LicenseRequirementsConfig {
  return JSON.parse(JSON.stringify(c)) as LicenseRequirementsConfig;
}

export function parseLicenseRequirementsConfig(
  raw: string | null | undefined
): LicenseRequirementsConfig {
  const def = defaultLicenseRequirementsConfig;
  if (!raw?.trim()) return cloneConfig(def);
  try {
    const v = JSON.parse(raw) as Partial<LicenseRequirementsConfig>;
    if (!v || typeof v !== "object") return cloneConfig(def);
    const steps = Array.isArray(v.steps)
      ? v.steps.map((s) => normalizeStep(s))
      : def.steps;
    const licenses = Array.isArray(v.licenses)
      ? v.licenses.map((l) => normalizeLicense(l))
      : def.licenses;
    return cloneConfig({
      ...def,
      ...v,
      steps,
      licenses,
    });
  } catch {
    return cloneConfig(def);
  }
}

export function firstIntFromHoursLabel(s: string): number {
  const m = String(s).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
