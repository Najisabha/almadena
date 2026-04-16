import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, User, BookOpen, Phone, Award, Users, Trophy, Settings, LogOut, Shield, ClipboardList, ChevronRight, ChevronLeft } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Link, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api as apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useNavbarConfig } from "@/features/siteSettings/useNavbarConfig";
import { NavbarItemConfig } from "@/features/siteSettings/navbar.types";
import {
  LicenseCatalogIconBox,
  getLicenseTileBgClassByCode,
  isLikelyHexColor,
  resolveImageUrl,
} from "@/components/license/LicenseCatalogIconBox";
import { cn } from "@/lib/utils";

type License = {
  id: string;
  code: string;
  name_ar: string;
  icon_url?: string | null;
  bg_color?: string | null;
  is_active?: boolean;
};

type DifficultyOption = {
  value: string;
  label: string;
  description: string;
};

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: "easy",   label: "سهل",     description: "30 سؤالاً من الأسئلة السهلة" },
  { value: "medium", label: "متوسط",   description: "30 سؤالاً من الأسئلة المتوسطة" },
  { value: "hard",   label: "صعب",     description: "30 سؤالاً من الأسئلة الصعبة" },
  { value: "random", label: "عشوائي",  description: "30 سؤالاً عشوائياً من جميع المستويات" },
];

type SessionUser = {
  id: string;
  email: string;
};

type Profile = {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

const iconMap = {
  Car,
  BookOpen,
  Trophy,
  Users,
  Award,
  Phone,
  User,
} as const;

/** ترتيب ثابت داخل كل مجموعة؛ العناصر المخفية في الإعدادات تُستبعد تلقائياً */
const DESKTOP_GROUP_HREFS = {
  home: ["/"] as const,
  learning: ["/questions", "/mock-exams", "/signs"] as const,
  academy: ["/student-results", "/instructors"] as const,
  contact: ["/contact"] as const,
};

function NavGroupDivider() {
  return (
    <div
      className="hidden xl:block h-6 w-px shrink-0 bg-border/60 mx-2"
      aria-hidden
    />
  );
}

function MobileNavSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground px-4 pt-4 pb-1">
      {children}
    </p>
  );
}

const navLinkClass =
  "inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 text-sm font-medium py-2 px-2.5 rounded-md hover:bg-primary/10 whitespace-nowrap";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { config } = useNavbarConfig();

  // Practice exam dialog state
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceStep, setPracticeStep] = useState<1 | 2>(1);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [licensesLoading, setLicensesLoading] = useState(false);

  const openPracticeDialog = async () => {
    setPracticeStep(1);
    setSelectedLicense(null);
    setSelectedDifficulty(null);
    setPracticeOpen(true);
    if (licenses.length === 0) {
      setLicensesLoading(true);
      try {
        const { data } = await apiClient
          .from<License>("licenses")
          .select()
          .order("display_order", { ascending: true });
        setLicenses(
          ((data as unknown as License[]) || []).filter((l) => l.is_active !== false)
        );
      } catch {
        setLicenses([]);
      } finally {
        setLicensesLoading(false);
      }
    }
  };

  const startPracticeExam = () => {
    if (!selectedLicense || !selectedDifficulty) return;
    setPracticeOpen(false);
    setIsOpen(false);
    navigate(
      `/mock-exam?license=${encodeURIComponent(selectedLicense.code)}&practice=1&difficulty=${selectedDifficulty}&perPage=30&exam=1`
    );
  };

  useEffect(() => {
    // Check current session
    apiClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = apiClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await apiClient
        .from<Profile>("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await apiClient.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "تعذر تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return user?.idNumber?.[0]?.toUpperCase() || "U";
  };

  const menuItems = useMemo(
    () =>
      config.items
        .filter((item) => item.kind === "menu" && item.isVisible)
        .sort((a, b) => a.order - b.order),
    [config.items]
  );

  const inquiryItems = useMemo(
    () =>
      config.items
        .filter((item) => item.kind === "inquiry" && item.isVisible)
        .sort((a, b) => a.order - b.order),
    [config.items]
  );

  const desktopNavGroups = useMemo(() => {
    const visible = menuItems.slice().sort((a, b) => a.order - b.order);
    const usedIds = new Set<string>();

    const pick = (hrefs: readonly string[]) => {
      const out: NavbarItemConfig[] = [];
      for (const href of hrefs) {
        const item = visible.find((i) => i.href === href && !usedIds.has(i.id));
        if (item) {
          usedIds.add(item.id);
          out.push(item);
        }
      }
      return out;
    };

    return {
      home: pick(DESKTOP_GROUP_HREFS.home),
      learning: pick(DESKTOP_GROUP_HREFS.learning),
      academy: pick(DESKTOP_GROUP_HREFS.academy),
      contact: pick(DESKTOP_GROUP_HREFS.contact),
      rest: visible.filter((i) => !usedIds.has(i.id)),
    };
  }, [menuItems]);

  const resolveIcon = (item: NavbarItemConfig) => {
    const key = (item.iconKey ?? "Car") as keyof typeof iconMap;
    return iconMap[key] || Car;
  };

  const mobileRowClass =
    "flex items-center gap-3 text-foreground hover:text-primary transition-all duration-300 px-4 py-3 mx-2 rounded-lg hover:bg-primary/10 font-medium";

  return (
    <>
    <nav className="bg-white/95 backdrop-blur-md shadow-navigation sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 rtl:space-x-reverse group">
            <div className="bg-gradient-primary p-3 rounded-xl shadow-button group-hover:scale-105 transition-transform duration-300">
              <Car className="h-7 w-7 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">أكاديمية المدينة</h1>
              <p className="text-sm text-muted-foreground font-medium">لتعليم القيادة الحديثة</p>
            </div>
          </Link>

          {/* Desktop Menu — مجموعات: رئيسية | تعلم | أكاديمية | استعلام | تواصل | حساب */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-end gap-2 xl:gap-3 ms-4">
            <div className="flex items-center gap-1 shrink-0">
              {desktopNavGroups.home.map((item) => (
                <Link key={item.id} to={item.href} className={navLinkClass}>
                  {item.title}
                </Link>
              ))}
            </div>

            <NavGroupDivider />

            <div className="flex items-center gap-1 shrink-0">
              {desktopNavGroups.learning.map((item) => (
                <Link key={item.id} to={item.href} className={navLinkClass}>
                  {item.title}
                </Link>
              ))}
              <button
                type="button"
                onClick={openPracticeDialog}
                className={cn(navLinkClass, "border-0 bg-transparent cursor-pointer")}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-primary/80" />
                الامتحان التجريبي
              </button>
            </div>

            <NavGroupDivider />

            <div className="flex items-center gap-1 shrink-0">
              {desktopNavGroups.academy.map((item) => (
                <Link key={item.id} to={item.href} className={navLinkClass}>
                  {item.title}
                </Link>
              ))}
            </div>

            <NavGroupDivider />

            <NavigationMenu className="max-w-max shrink-0">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      navLinkClass,
                      "h-auto min-h-10 bg-transparent hover:bg-primary/10 data-[state=open]:bg-primary/10 data-[active]:bg-primary/10"
                    )}
                  >
                    الاستعلام والخدمات
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {inquiryItems.map((item) => (
                        <li key={item.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                            >
                              <div className="text-sm font-medium leading-none text-right">{item.title}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground text-right">
                                {item.description ?? ""}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {(desktopNavGroups.contact.length > 0 || desktopNavGroups.rest.length > 0) && (
              <>
                <NavGroupDivider />
                <div className="flex items-center gap-1 shrink-0">
                  {desktopNavGroups.contact.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={cn(navLinkClass, "text-muted-foreground hover:text-primary")}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {desktopNavGroups.rest.map((item) => (
                    <Link key={item.id} to={item.href} className={navLinkClass}>
                      {item.title}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <NavGroupDivider />

            <div className="flex items-center gap-2 shrink-0">
            {isAdmin && user && (
              <Link to="/admin" className={navLinkClass}>
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                Admin
              </Link>
            )}
            
            {user ? (
              <>
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 text-right">
                        <p className="text-sm font-medium leading-none">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          رقم الهوية: {user?.idNumber}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <User className="ml-2 h-4 w-4" />
                        <span>لوحة التحكم</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="ml-2 h-4 w-4" />
                          <span>لوحة Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Settings className="ml-2 h-4 w-4" />
                        <span>الإعدادات</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="ml-2 h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button className="shadow-button hover:shadow-elevated transition-all duration-300" asChild>
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
            )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-border/50 bg-white/95 backdrop-blur-md max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col">
              {desktopNavGroups.home.length > 0 && (
                <>
                  <MobileNavSectionTitle>الرئيسية</MobileNavSectionTitle>
                  {desktopNavGroups.home.map((item) => {
                    const Icon = resolveIcon(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={mobileRowClass}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary/80" />
                        <span className="flex-1 text-right">{item.title}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              <MobileNavSectionTitle>التعلم والامتحان</MobileNavSectionTitle>
              {desktopNavGroups.learning.map((item) => {
                const Icon = resolveIcon(item);
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={mobileRowClass}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-primary/80" />
                    <span className="flex-1 text-right">{item.title}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={openPracticeDialog}
                className={cn(mobileRowClass, "border-0 bg-transparent cursor-pointer text-right")}
              >
                <ClipboardList className="h-5 w-5 shrink-0 text-primary/80" />
                <span className="flex-1 text-right">الامتحان التجريبي</span>
              </button>

              {desktopNavGroups.academy.length > 0 && (
                <>
                  <MobileNavSectionTitle>الأكاديمية</MobileNavSectionTitle>
                  {desktopNavGroups.academy.map((item) => {
                    const Icon = resolveIcon(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={mobileRowClass}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary/80" />
                        <span className="flex-1 text-right">{item.title}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {inquiryItems.length > 0 && (
                <div className="pt-2">
                  <MobileNavSectionTitle>الاستعلام والخدمات</MobileNavSectionTitle>
                  <div className="space-y-1 px-2 pt-1">
                    {inquiryItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        className="flex flex-col gap-0.5 text-foreground hover:text-primary transition-all duration-300 px-4 py-2.5 mx-2 rounded-lg hover:bg-primary/10 text-sm"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="font-medium text-right">{item.title}</span>
                        {item.description ? (
                          <span className="text-xs text-muted-foreground text-right line-clamp-2">
                            {item.description}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {(desktopNavGroups.contact.length > 0 || desktopNavGroups.rest.length > 0) && (
                <>
                  <MobileNavSectionTitle>تواصل وروابط إضافية</MobileNavSectionTitle>
                  {desktopNavGroups.contact.map((item) => {
                    const Icon = resolveIcon(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={mobileRowClass}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-right">{item.title}</span>
                      </Link>
                    );
                  })}
                  {desktopNavGroups.rest.map((item) => {
                    const Icon = resolveIcon(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={mobileRowClass}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary/80" />
                        <span className="flex-1 text-right">{item.title}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="px-4 pt-2">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          رقم الهوية: {user?.idNumber}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-primary/10"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>الإعدادات</span>
                    </Link>
                    <Button 
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }} 
                      variant="destructive" 
                      className="w-full"
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full shadow-button" asChild>
                    <Link to="/auth">تسجيل الدخول</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>

    {/* Practice Exam Dialog */}
    <Dialog open={practiceOpen} onOpenChange={(open) => { setPracticeOpen(open); if (!open) { setPracticeStep(1); setSelectedDifficulty(null); } }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            الامتحان التجريبي
            {practiceStep === 2 && selectedLicense && (
              <span className="text-sm font-normal text-muted-foreground mr-auto">
                — {selectedLicense.name_ar}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {practiceStep === 1 && (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground text-right">اختر نوع الرخصة:</p>
            {licensesLoading && (
              <p className="text-center text-muted-foreground py-4">جاري تحميل الرخص...</p>
            )}
            {!licensesLoading && licenses.length === 0 && (
              <p className="text-center text-muted-foreground py-4">لا توجد رخص متاحة.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {licenses.map((license) => (
                <button
                  key={license.id}
                  onClick={() => {
                    setSelectedLicense(license);
                    setPracticeStep(2);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-right"
                >
                  <LicenseCatalogIconBox
                    iconUrl={resolveImageUrl(license.icon_url)}
                    bgHex={
                      license.bg_color && isLikelyHexColor(license.bg_color)
                        ? license.bg_color.trim()
                        : null
                    }
                    tileBgClass={getLicenseTileBgClassByCode(license.code)}
                    licenseCode={license.code}
                  />
                  <span className="font-semibold text-sm">{license.name_ar}</span>
                  <span className="text-xs text-muted-foreground">({license.code})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {practiceStep === 2 && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => { setPracticeStep(1); setSelectedDifficulty(null); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                رجوع
              </button>
            </div>
            <p className="text-sm text-muted-foreground text-right">اختر مستوى الصعوبة:</p>
            <div className="grid grid-cols-2 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDifficulty(opt.value)}
                  className={`p-4 rounded-xl border-2 text-right transition-all duration-200 ${
                    selectedDifficulty === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.description}</div>
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-2"
              disabled={!selectedDifficulty}
              onClick={startPracticeExam}
            >
              <ChevronLeft className="h-4 w-4 ml-1" />
              ابدأ الامتحان
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Navigation;