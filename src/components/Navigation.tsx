import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Car, User, BookOpen, Phone, Award, Users, Trophy, Search, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const menuItems = [
    { title: 'الرئيسية', href: '/', icon: Car },
    { title: 'أسئلة التووري', href: '/questions', icon: BookOpen },
    { title: 'الامتحانات التجريبية', href: '/mock-exams', icon: Award },
    { title: 'نتائج طلابنا', href: '/student-results', icon: Trophy },
    { title: 'مدربينا', href: '/instructors', icon: Users },
    { title: 'لوحة التحكم', href: '/dashboard', icon: User },
    { title: 'اتصل بنا', href: '/contact', icon: Phone },
  ];

  const inquiryItems = [
    { title: 'متطلبات الرخصة', href: '/license-requirements', description: 'تعرف على شروط ومتطلبات الحصول على الرخصة' },
    { title: 'أسعار الدروس', href: '/pricing', description: 'باقات وأسعار تدريب القيادة' },
    { title: 'نتائج طلاب التووريا', href: '/student-lookup', description: 'استعلم عن نتائجك في التووريا' },
    { title: 'نتائج طلاب العملي', href: '/student-lookup', description: 'استعلم عن نتائجك في الامتحان العملي' },
  ];

  return (
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

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
            <Link to="/" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              الرئيسية
            </Link>
            <Link to="/questions" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              أسئلة التووري
            </Link>
            <Link to="/student-results" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              نتائج طلابنا
            </Link>
            <Link to="/instructors" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              مدربينا
            </Link>
            
            {/* Inquiry Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-foreground hover:text-primary font-medium">
                    <Search className="h-4 w-4 ml-2" />
                    الاستعلام عن
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {inquiryItems.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                            >
                              <div className="text-sm font-medium leading-none text-right">{item.title}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground text-right">
                                {item.description}
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

            <Link to="/mock-exams" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              الامتحانات التجريبية
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10">
              اتصل بنا
            </Link>
            
            {isAdmin && user && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-all duration-300 font-medium py-2 px-3 rounded-lg hover:bg-primary/10 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            
            {user ? (
              <>
                {/* Notifications Bell */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
                </Button>

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
                          {user?.email}
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
            <div className="flex flex-col space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center space-x-3 rtl:space-x-reverse text-foreground hover:text-primary transition-all duration-300 px-4 py-3 mx-2 rounded-lg hover:bg-primary/10 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
              
              {/* Mobile Inquiry Section */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                  <Search className="h-4 w-4" />
                  <span>الاستعلام عن</span>
                </div>
                <div className="space-y-2">
                  {inquiryItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block text-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-primary/10 text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>

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
                          {user?.email}
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
  );
};

export default Navigation;