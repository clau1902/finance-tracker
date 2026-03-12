"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STARTERS = [
  "How much did I spend this month?",
  "What are my account balances?",
  "Show me my budget status",
  "What's my biggest expense category?",
];

export function AiChat() {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({ api: "/api/chat" });

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendStarter(text: string) {
    setInput(text);
    // Submit programmatically after state update
    setTimeout(() => {
      const form = document.getElementById("ai-chat-form") as HTMLFormElement | null;
      form?.requestSubmit();
    }, 0);
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open AI assistant"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:opacity-90 active:scale-95",
          open && "rotate-90 opacity-80"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-20 right-5 z-50 flex flex-col",
            "w-[min(380px,calc(100vw-2rem))] h-[520px]",
            "rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Finance Assistant</span>
            <span className="ml-auto text-xs text-muted-foreground">AI-powered</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isEmpty ? (
              <div className="flex flex-col items-center gap-4 pt-6 text-center">
                <Bot className="h-10 w-10 text-primary/60" />
                <div>
                  <p className="text-sm font-medium">Ask me anything about your finances</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    I can look up transactions, balances, budgets, and more.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendStarter(s)}
                      className="text-xs text-left px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2 text-sm",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {m.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[82%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}
                  >
                    {m.content || (
                      // Tool-call step in progress
                      <span className="text-muted-foreground text-xs italic">Thinking…</span>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading dots */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-muted px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            id="ai-chat-form"
            onSubmit={handleSubmit}
            className="flex gap-2 p-3 border-t border-border bg-muted/20"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your finances…"
              disabled={isLoading}
              className="h-9 text-sm"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
