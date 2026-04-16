import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronUp, MapPin, Loader2, Pencil, Check, X } from "lucide-react";
import {
  fetchSignupPlacesAdmin,
  addCity,
  updateCity,
  deleteCity,
  addTown,
  updateTown,
  deleteTown,
  type AdminCity,
  type AdminTown,
} from "@/features/signupPlaces/signupPlaces.service";

export const AdminPlaces = () => {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [newCityName, setNewCityName] = useState("");
  const [newCityLoading, setNewCityLoading] = useState(false);
  const [newTownInputs, setNewTownInputs] = useState<Record<string, string>>({});
  const [newTownLoading, setNewTownLoading] = useState<Record<string, boolean>>({});
  const [deletingCity, setDeletingCity] = useState<string | null>(null);
  const [deletingTown, setDeletingTown] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState<{ id: string; value: string } | null>(null);
  const [editingTown, setEditingTown] = useState<{ id: string; value: string } | null>(null);
  const { toast } = useToast();

  const loadCities = async () => {
    setIsLoading(true);
    const { data, error } = await fetchSignupPlacesAdmin();
    if (error) {
      toast({ title: "تنبيه", description: "تعذر تحميل الأماكن: " + error, variant: "destructive" });
      setCities([]);
    } else {
      setCities(data ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadCities();
  }, []);

  // ─── City actions ─────────────────────────────────────────────────────────

  const handleAddCity = async () => {
    const name = newCityName.trim();
    if (!name) return;
    setNewCityLoading(true);
    const { data, error } = await addCity(name, cities.length);
    setNewCityLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }
    setCities((prev) => [...prev, { ...data!, towns: [] }]);
    setExpandedCity(data!.id);
    setNewCityName("");
  };

  const handleRenameCity = async (cityId: string) => {
    const name = editingCity?.value.trim();
    if (!name) { setEditingCity(null); return; }
    const original = cities.find((c) => c.id === cityId)?.name_ar;
    if (name === original) { setEditingCity(null); return; }
    const { data, error } = await updateCity(cityId, { name_ar: name });
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
    } else {
      setCities((prev) => prev.map((c) => c.id === cityId ? { ...c, name_ar: data!.name_ar } : c));
    }
    setEditingCity(null);
  };

  const handleDeleteCity = async (cityId: string) => {
    setDeletingCity(cityId);
    const { error } = await deleteCity(cityId);
    setDeletingCity(null);
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }
    setCities((prev) => prev.filter((c) => c.id !== cityId));
    if (expandedCity === cityId) setExpandedCity(null);
    toast({ title: "تم الحذف", description: "تم حذف المدينة وبلداتها" });
  };

  // ─── Town actions ─────────────────────────────────────────────────────────

  const handleAddTown = async (cityId: string) => {
    const name = (newTownInputs[cityId] || "").trim();
    if (!name) return;
    setNewTownLoading((prev) => ({ ...prev, [cityId]: true }));
    const city = cities.find((c) => c.id === cityId);
    const { data, error } = await addTown(cityId, name, city?.towns.length ?? 0);
    setNewTownLoading((prev) => ({ ...prev, [cityId]: false }));
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }
    setCities((prev) =>
      prev.map((c) => c.id === cityId ? { ...c, towns: [...c.towns, data!] } : c)
    );
    setNewTownInputs((prev) => ({ ...prev, [cityId]: "" }));
  };

  const handleRenameTown = async (townId: string, cityId: string) => {
    const name = editingTown?.value.trim();
    if (!name) { setEditingTown(null); return; }
    const city = cities.find((c) => c.id === cityId);
    const original = city?.towns.find((t) => t.id === townId)?.name_ar;
    if (name === original) { setEditingTown(null); return; }
    const { data, error } = await updateTown(townId, { name_ar: name });
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
    } else {
      setCities((prev) =>
        prev.map((c) =>
          c.id === cityId
            ? { ...c, towns: c.towns.map((t) => t.id === townId ? { ...t, name_ar: data!.name_ar } : t) }
            : c
        )
      );
    }
    setEditingTown(null);
  };

  const handleDeleteTown = async (townId: string, cityId: string) => {
    setDeletingTown(townId);
    const { error } = await deleteTown(townId);
    setDeletingTown(null);
    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }
    setCities((prev) =>
      prev.map((c) =>
        c.id === cityId ? { ...c, towns: c.towns.filter((t) => t.id !== townId) } : c
      )
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">جاري تحميل الأماكن...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          إدارة الأماكن
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          إدارة المدن والبلدات التي تظهر في صفحة إنشاء الحساب
        </p>
      </div>

      {/* Add city */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">إضافة مدينة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="اسم المدينة"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleAddCity()}
              className="text-right flex-1"
              disabled={newCityLoading}
            />
            <Button onClick={() => void handleAddCity()} variant="outline" className="gap-1" disabled={newCityLoading}>
              {newCityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cities list */}
      <div className="space-y-3">
        {cities.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد مدن — أضف مدينة جديدة من الأعلى
            </CardContent>
          </Card>
        )}

        {cities.map((city) => {
          const isOpen = expandedCity === city.id;
          const isEditingThisCity = editingCity?.id === city.id;

          return (
            <Card key={city.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedCity(isOpen ? null : city.id)}
                    className="shrink-0 p-1"
                  >
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>

                  {isEditingThisCity ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingCity.value}
                        onChange={(e) => setEditingCity({ id: city.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleRenameCity(city.id);
                          if (e.key === "Escape") setEditingCity(null);
                        }}
                        className="h-7 text-sm text-right flex-1"
                        autoFocus
                      />
                      <button onClick={() => void handleRenameCity(city.id)} className="text-primary hover:text-primary/80">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingCity(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">{city.name_ar}</span>
                      <span className="text-xs text-muted-foreground shrink-0">({city.towns.length} بلدة)</span>
                      <button
                        onClick={() => setEditingCity({ id: city.id, value: city.name_ar })}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => void handleDeleteCity(city.id)}
                    disabled={deletingCity === city.id}
                  >
                    {deletingCity === city.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  <div className="space-y-2">
                    <CardDescription className="text-xs">البلدات</CardDescription>
                    {city.towns.length === 0 && (
                      <p className="text-sm text-muted-foreground text-right">لا توجد بلدات بعد</p>
                    )}
                    {city.towns.map((town: AdminTown) => {
                      const isEditingThisTown = editingTown?.id === town.id;
                      return (
                        <div key={town.id} className="flex items-center gap-2">
                          {isEditingThisTown ? (
                            <>
                              <Input
                                value={editingTown.value}
                                onChange={(e) => setEditingTown({ id: town.id, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void handleRenameTown(town.id, city.id);
                                  if (e.key === "Escape") setEditingTown(null);
                                }}
                                className="h-7 text-sm text-right flex-1"
                                autoFocus
                              />
                              <button onClick={() => void handleRenameTown(town.id, city.id)} className="text-primary hover:text-primary/80 shrink-0">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingTown(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm text-right px-3 py-1.5 rounded-md border border-border bg-muted/30">
                                {town.name_ar}
                              </span>
                              <button
                                onClick={() => setEditingTown({ id: town.id, value: town.name_ar })}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => void handleDeleteTown(town.id, city.id)}
                                disabled={deletingTown === town.id}
                              >
                                {deletingTown === town.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />
                                }
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add town */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="اسم البلدة الجديدة"
                      value={newTownInputs[city.id] || ""}
                      onChange={(e) =>
                        setNewTownInputs((prev) => ({ ...prev, [city.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && void handleAddTown(city.id)}
                      className="text-right text-sm h-8 flex-1"
                      disabled={newTownLoading[city.id]}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-8"
                      onClick={() => void handleAddTown(city.id)}
                      disabled={newTownLoading[city.id]}
                    >
                      {newTownLoading[city.id]
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Plus className="h-3.5 w-3.5" />
                      }
                      إضافة
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
