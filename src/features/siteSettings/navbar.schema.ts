import { z } from "zod";
import { NavbarConfig } from "./navbar.types";

const navbarItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["menu", "inquiry"]),
  title: z.string().min(1),
  href: z.string().min(1),
  description: z.string().optional(),
  iconKey: z.string().optional(),
  order: z.number().int().min(0),
  isVisible: z.boolean(),
});

const navbarBadgeSchema = z.object({
  enabled: z.boolean(),
  count: z.number().int().min(0).max(999),
  color: z.enum(["destructive", "primary", "success"]),
  targetHref: z.string().optional(),
});

export const navbarConfigSchema = z.object({
  items: z.array(navbarItemSchema),
  badge: navbarBadgeSchema,
});

export function safeParseNavbarConfig(value: unknown): NavbarConfig | null {
  const parsed = navbarConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
