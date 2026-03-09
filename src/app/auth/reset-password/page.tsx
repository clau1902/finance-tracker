import { ResetPasswordForm } from "@/components/reset-password-form";
import { TrendingUp } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

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
          <h1 className="text-xl font-semibold mb-1">Set new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a strong password for your account.
          </p>
          <ResetPasswordForm token={token ?? ""} />
        </div>
      </div>
    </div>
  );
}
