export type NavbarItemKind = "menu" | "inquiry";

export type NavbarItemConfig = {
  id: string;
  kind: NavbarItemKind;
  title: string;
  href: string;
  description?: string;
  iconKey?: string;
  order: number;
  isVisible: boolean;
};

export type NavbarBadgeColor = "destructive" | "primary" | "success";

export type NavbarBadgeConfig = {
  enabled: boolean;
  count: number;
  color: NavbarBadgeColor;
  targetHref?: string;
};

export type NavbarConfig = {
  items: NavbarItemConfig[];
  badge: NavbarBadgeConfig;
};
