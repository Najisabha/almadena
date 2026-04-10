import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NavbarBadgeConfig } from "@/features/siteSettings/navbar.types";

type Props = {
  badge: NavbarBadgeConfig;
  onChange: (badge: NavbarBadgeConfig) => void;
};

export function NotificationBadgeEditor({ badge, onChange }: Props) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="font-semibold">إعدادات إشارة الجرس</h4>
      <div className="flex items-center gap-2">
        <Switch checked={badge.enabled} onCheckedChange={(checked) => onChange({ ...badge, enabled: checked })} />
        <span className="text-sm">تفعيل الإشارة</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>العداد</Label>
          <Input
            type="number"
            min={0}
            max={999}
            value={badge.count}
            onChange={(e) => onChange({ ...badge, count: Number(e.target.value || 0) })}
          />
        </div>
        <div className="space-y-2">
          <Label>اللون</Label>
          <Select value={badge.color} onValueChange={(value: NavbarBadgeConfig["color"]) => onChange({ ...badge, color: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="destructive">أحمر</SelectItem>
              <SelectItem value="primary">أساسي</SelectItem>
              <SelectItem value="success">نجاح</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>رابط الوجهة</Label>
          <Input
            value={badge.targetHref ?? ""}
            onChange={(e) => onChange({ ...badge, targetHref: e.target.value })}
            placeholder="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
