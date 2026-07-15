import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the status label", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("styles paid/free/completed as green (success)", () => {
    for (const s of ["paid", "free", "completed"]) {
      const { container } = render(<StatusBadge status={s} />);
      expect(container.firstChild).toHaveClass("text-emerald-700");
    }
  });

  it("styles pending as amber and cancelled as slate", () => {
    const { container: pending } = render(<StatusBadge status="pending" />);
    expect(pending.firstChild).toHaveClass("text-amber-700");
    const { container: cancelled } = render(<StatusBadge status="cancelled" />);
    expect(cancelled.firstChild).toHaveClass("text-slate-600");
  });

  it("falls back to a dash for an empty status", () => {
    render(<StatusBadge status="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
