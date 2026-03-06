"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ConnectBankButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "default";
  className?: string;
  children?: React.ReactNode;
}

export function ConnectBankButton({
  variant = "default",
  size,
  className,
  children,
}: ConnectBankButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/truelayer/connect");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to initiate bank connection");
        setLoading(false);
        return;
      }
      // TrueLayer handles institution selection on their hosted page
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Link2 className="w-4 h-4" />
      )}
      {children ?? "Connect Bank"}
    </Button>
  );
}
