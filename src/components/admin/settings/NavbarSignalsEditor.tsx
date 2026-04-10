import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NavbarItemConfig, NavbarItemKind } from "@/features/siteSettings/navbar.types";

type Props = {
  title: string;
  kind: NavbarItemKind;
  items: NavbarItemConfig[];
  onChange: (items: NavbarItemConfig[]) => void;
};

export function NavbarSignalsEditor({ title, kind, items, onChange }: Props) {
  const scoped = items.filter((item) => item.kind === kind).sort((a, b) => a.order - b.order);

  const patchItem = (id: string, patch: Partial<NavbarItemConfig>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const maxOrder = scoped.reduce((max, item) => Math.max(max, item.order), 0);
    const newItem: NavbarItemConfig = {
      id: `${kind}-${Date.now()}`,
      kind,
      title: "عنصر جديد",
      href: "/",
      description: kind === "inquiry" ? "وصف مختصر" : undefined,
      order: maxOrder + 1,
      isVisible: true,
      iconKey: kind === "menu" ? "Car" : undefined,
    };
    onChange([...items, newItem]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <Button type="button" variant="outline" onClick={addItem}>
          إضافة عنصر
        </Button>
      </div>

      <div className="space-y-4">
        {scoped.map((item) => (
          <div key={item.id} className="rounded-lg border p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={item.title} onChange={(e) => patchItem(item.id, { title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الرابط</Label>
                <Input value={item.href} onChange={(e) => patchItem(item.id, { href: e.target.value })} />
              </div>
              {kind === "inquiry" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>الوصف</Label>
                  <Input
                    value={item.description ?? ""}
                    onChange={(e) => patchItem(item.id, { description: e.target.value })}
                  />
                </div>
              )}
              {kind === "menu" && (
                <div className="space-y-2">
                  <Label>اسم الأيقونة</Label>
                  <Input
                    value={item.iconKey ?? ""}
                    onChange={(e) => patchItem(item.id, { iconKey: e.target.value })}
                    placeholder="Car, BookOpen, Trophy..."
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.order}
                  onChange={(e) => patchItem(item.id, { order: Number(e.target.value || 1) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isVisible}
                  onCheckedChange={(checked) => patchItem(item.id, { isVisible: checked })}
                />
                <span className="text-sm">ظاهر في النافبار</span>
              </div>
              <Button type="button" variant="destructive" onClick={() => removeItem(item.id)}>
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
