import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

// Mock next-auth session
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Jane Smith" } } }),
}));

// Mock ConnectBankButton to avoid TrueLayer API calls in tests
vi.mock("@/components/connect-bank-button", () => ({
  ConnectBankButton: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

function renderChecklist(props: {
  hasAccounts?: boolean;
  hasTransactions?: boolean;
  onAddTransaction?: () => void;
}) {
  return render(
    <OnboardingChecklist
      hasAccounts={props.hasAccounts ?? false}
      hasTransactions={props.hasTransactions ?? false}
      onAddTransaction={props.onAddTransaction ?? vi.fn()}
    />
  );
}

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders for a brand new user", () => {
    renderChecklist({});
    expect(screen.getByText(/let's get started/i)).toBeInTheDocument();
  });

  it("shows '0 of 2 required steps complete' initially", () => {
    renderChecklist({});
    expect(screen.getByText("0 of 2 required steps complete")).toBeInTheDocument();
  });

  it("shows '1 of 2 required steps complete' when accounts exist", () => {
    renderChecklist({ hasAccounts: true });
    expect(screen.getByText("1 of 2 required steps complete")).toBeInTheDocument();
  });

  it("shows celebration state when both steps done", () => {
    renderChecklist({ hasAccounts: true, hasTransactions: true });
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.getByText(/closing in a moment/i)).toBeInTheDocument();
  });

  it("personalises greeting with first name", () => {
    renderChecklist({});
    expect(screen.getByText(/welcome, jane/i)).toBeInTheDocument();
  });

  it("hides after clicking dismiss and stays hidden on re-render", () => {
    const { unmount } = renderChecklist({});
    fireEvent.click(screen.getByLabelText("Dismiss onboarding"));
    expect(screen.queryByText(/let's get started/i)).not.toBeInTheDocument();
    expect(localStorage.getItem("ftk_onboarding_dismissed")).toBe("true");

    unmount();
    renderChecklist({});
    expect(screen.queryByText(/let's get started/i)).not.toBeInTheDocument();
  });

  it("does not render when already dismissed in localStorage", () => {
    localStorage.setItem("ftk_onboarding_dismissed", "true");
    renderChecklist({});
    expect(screen.queryByText(/let's get started/i)).not.toBeInTheDocument();
  });

  it("'Add transaction' button is disabled when no accounts", () => {
    renderChecklist({ hasAccounts: false });
    const btn = screen.getByRole("button", { name: /add/i });
    expect(btn).toBeDisabled();
  });

  it("'Add transaction' button calls onAddTransaction when accounts exist", () => {
    const onAddTransaction = vi.fn();
    renderChecklist({ hasAccounts: true, onAddTransaction });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onAddTransaction).toHaveBeenCalledOnce();
  });

  it("shows completed steps with strikethrough text", () => {
    renderChecklist({ hasAccounts: true });
    const completedStep = screen.getByText("Connect your bank");
    expect(completedStep).toHaveClass("line-through");
  });
});
