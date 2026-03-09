import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { TrendingUp } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl tracking-tight">FinanceTrack</span>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h1 className="text-xl font-semibold mb-1">Forgot password?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
