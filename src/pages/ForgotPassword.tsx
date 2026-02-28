import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Here you would integrate with your backend/Supabase
      // For now, we'll simulate the action
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      toast({
        title: "تم إرسال البريد",
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال البريد الإلكتروني",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-border/50">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">نسيت كلمة المرور</CardTitle>
            <CardDescription className="text-base">
              {emailSent 
                ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
                : "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full shadow-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "جاري الإرسال..."
                  ) : (
                    <>
                      إرسال رابط إعادة التعيين
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <Link 
                    to="/auth" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    العودة إلى تسجيل الدخول
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="text-sm text-muted-foreground">
                  إذا لم تستلم البريد خلال بضع دقائق، يرجى التحقق من مجلد البريد المزعج
                </div>
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة إلى تسجيل الدخول
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  إرسال البريد مرة أخرى
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
