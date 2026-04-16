import { useState } from "react";
import { Bike, Bus, Car, Tractor, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function resolveImageUrl(url?: string | null): string {
  const clean = String(url ?? "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("//")) return `https:${clean}`;
  return `${API_BASE}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

export function isLikelyHexColor(s: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim());
}

/** يطابق صفحة الأسئلة العامة — أيقونة ولون واضحان حتى مع bg_color أبيض من قاعدة البيانات */
export function getLicenseVisualByCode(code: string | null | undefined): { Icon: LucideIcon; iconClass: string } {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "B") return { Icon: Car, iconClass: "text-primary" };
  if (normalized === "C1") return { Icon: Truck, iconClass: "text-orange-600" };
  if (normalized === "C") return { Icon: Truck, iconClass: "text-amber-700" };
  if (normalized === "D1") return { Icon: Bus, iconClass: "text-blue-600" };
  if (normalized === "A") return { Icon: Bike, iconClass: "text-red-600" };
  if (normalized === "T") return { Icon: Tractor, iconClass: "text-green-600" };
  return { Icon: Car, iconClass: "text-primary" };
}

/** خلفية مربع الأيقونة في وضع الكتالوج — ثابتة حسب رمز الرخصة لتفادي ألوان JSON المدمجة الخاطئة */
export function getLicenseTileBgClassByCode(code: string | null | undefined): string {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "B") return "bg-blue-500";
  if (normalized === "C1") return "bg-orange-500";
  if (normalized === "C") return "bg-amber-500";
  if (normalized === "D1") return "bg-indigo-600";
  if (normalized === "A") return "bg-red-500";
  if (normalized === "T") return "bg-green-600";
  return "bg-slate-500";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = String(hex).trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || !/^[0-9a-f]+$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function isVeryLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.92;
}

export function LicenseCatalogIconBox({
  iconUrl,
  bgHex,
  tileBgClass,
  licenseCode,
  variant = "grid",
}: {
  iconUrl: string;
  bgHex: string | null;
  tileBgClass: string;
  licenseCode: string;
  variant?: "grid" | "preview";
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const meta = getLicenseVisualByCode(licenseCode);
  const solid =
    bgHex && isLikelyHexColor(bgHex) && !isVeryLightHex(bgHex) ? bgHex.trim() : null;
  const showImg = Boolean(iconUrl) && !imgBroken;
  const iconOnFilledTile = Boolean(solid || tileBgClass);

  return (
    <div
      className={cn(
        variant === "grid"
          ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-inner sm:h-16 sm:w-16"
          : "mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-xl shadow-inner sm:mx-0",
        showImg ? "p-2" : "",
        !solid && tileBgClass
      )}
      style={solid ? { backgroundColor: solid } : undefined}
    >
      {showImg ? (
        <img
          src={iconUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
          onError={() => setImgBroken(true)}
        />
      ) : (
        <meta.Icon
          className={cn(
            variant === "grid" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9",
            iconOnFilledTile ? "text-white" : meta.iconClass
          )}
        />
      )}
    </div>
  );
}
