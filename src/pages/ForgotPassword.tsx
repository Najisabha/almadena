import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [idNumber, setIdNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم الهوية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      toast({
        title: "تم",
        description: "سيتم التواصل معك لإعادة تعيين كلمة المرور",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ، يرجى المحاولة مجددًا",
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
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">نسيت كلمة المرور</CardTitle>
            <CardDescription className="text-base">
              {submitted
                ? "تم استلام طلبك، سيتم التواصل معك لإعادة تعيين كلمة المرور"
                : "أدخل رقم هويتك وسيتم التواصل معك لإعادة تعيين كلمة المرور"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id-number">رقم الهوية</Label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="id-number"
                      type="text"
                      placeholder="أدخل رقم الهوية"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="pr-10 text-right"
                      disabled={isLoading}
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
                      إرسال طلب إعادة التعيين
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
                  تواصل مع إدارة الأكاديمية لإعادة تعيين كلمة المرور
                </div>
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة إلى تسجيل الدخول
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => setSubmitted(false)}
                  className="w-full"
                >
                  إرسال طلب مرة أخرى
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
