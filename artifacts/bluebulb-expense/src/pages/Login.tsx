import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials or server error.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-sidebar relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            alt="Corporate Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md inline-block mb-8 shadow-2xl border border-white/20">
             <img 
              src={`${import.meta.env.BASE_URL}images/logo.png`} 
              alt="Bluebulb Logo" 
              className="h-24 w-24 filter brightness-0 invert" 
            />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">Bluebulb Expense</h1>
          <p className="text-sidebar-foreground/80 text-lg max-w-md mx-auto">
            Streamlined expense management, multi-level approvals, and clear financial oversight for enterprise teams.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="mb-8 lg:hidden text-center">
            <img 
              src={`${import.meta.env.BASE_URL}images/logo.png`} 
              alt="Bluebulb Logo" 
              className="h-16 w-16 mx-auto mb-4" 
            />
            <h1 className="text-2xl font-display font-bold text-foreground">Bluebulb Expense</h1>
          </div>
          
          <Card className="border-0 shadow-xl shadow-black/5 bg-white/50 backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-display font-bold">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="name@bluebulb.com" 
                      className="pl-10 py-6 bg-white border-muted-foreground/20 focus-visible:ring-primary/20 transition-all rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 py-6 bg-white border-muted-foreground/20 focus-visible:ring-primary/20 transition-all rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
