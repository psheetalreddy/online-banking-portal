import { CreditCard, Lock, Shield, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.06_250)] via-[oklch(0.22_0.08_245)] to-[oklch(0.28_0.1_240)] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ClearBank</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Banking made simple,
            <br />
            secure &amp; smart.
          </h2>
          <p className="text-white/70 text-lg">
            Manage all your accounts, transfers, and payments in one place.
          </p>
        </div>
        <div className="space-y-4">
          {[
            {
              icon: Shield,
              text: "Bank-grade security with Internet Identity",
            },
            {
              icon: TrendingUp,
              text: "Real-time account balances & transactions",
            },
            { icon: Lock, text: "Your data stays private and encrypted" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">ClearBank</h1>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground mb-8">
              Sign in securely with Internet Identity to access your banking
              portal.
            </p>

            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold"
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              New users will be automatically registered on first login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
