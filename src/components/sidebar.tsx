"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  TrendingUp,
  LogOut,
  Tags,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tags },
];

interface BudgetAlert {
  over: number;
  warning: number;
}

function SidebarNav({
  pathname,
  session,
  theme,
  setTheme,
  budgetAlert,
  onNavigate,
}: {
  pathname: string;
  session: ReturnType<typeof useSession>["data"];
  theme: string | undefined;
  setTheme: (t: string) => void;
  budgetAlert: BudgetAlert;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">FinanceTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const isBudgets = item.href === "/budgets";
          const badgeCount = isBudgets ? budgetAlert.over + budgetAlert.warning : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className={cn(
                  "text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                  budgetAlert.over > 0
                    ? "bg-rose-500 text-white"
                    : "bg-amber-400 text-amber-900"
                )}>
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + controls */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {session?.user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-sidebar-foreground/90 truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-sidebar-foreground/40 truncate">
              {session.user.email}
            </p>
          </div>
        )}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert>({ over: 0, warning: 0 });

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch budget alerts (current month)
  useEffect(() => {
    const now = new Date();
    fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then((r) => r.json())
      .then((data: { spent: number; amount: string }[]) => {
        if (!Array.isArray(data)) return;
        let over = 0;
        let warning = 0;
        for (const b of data) {
          const pct = b.spent / parseFloat(b.amount);
          if (pct >= 1) over++;
          else if (pct >= 0.8) warning++;
        }
        setBudgetAlert({ over, warning });
      })
      .catch(() => {});
  }, [pathname]); // refresh when navigating

  const navProps = {
    pathname,
    session,
    theme,
    setTheme,
    budgetAlert,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <SidebarNav {...navProps} />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground shadow-md"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav {...navProps} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
