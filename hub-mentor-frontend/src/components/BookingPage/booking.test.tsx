import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Booking from "./booking";

const mentor = {
  firstName: "Jane",
  lastName: "Doe",
  selected_class: [
    { class_id: { _id: "c1", class: "Grade 10", syllabus: "CBSE" }, price: 500, subject: [] },
  ],
};

const baseForm = {
  selectedSyllabus: "",
  selectedClass: null,
  bookingType: "full",
  selectedSubjects: [] as string[],
  totalAmount: 500,
};

describe("Booking (step 1)", () => {
  it("renders the mentor's name and heading", () => {
    render(<Booking mentor={mentor} formData={baseForm} setFormData={vi.fn()} />);
    expect(screen.getByText("Book a session")).toBeInTheDocument();
    expect(screen.getByText(/Jane\s+Doe/)).toBeInTheDocument();
  });

  it("shows the price total for a paid booking", () => {
    render(<Booking mentor={mentor} formData={{ ...baseForm, totalAmount: 500 }} setFormData={vi.fn()} />);
    expect(screen.getByText("₹500")).toBeInTheDocument();
  });

  it('shows "Free" instead of ₹0 when the total is zero', () => {
    render(<Booking mentor={mentor} formData={{ ...baseForm, totalAmount: 0 }} setFormData={vi.fn()} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("₹0")).not.toBeInTheDocument();
  });

  it("handles a null mentor gracefully", () => {
    render(<Booking mentor={null} formData={baseForm} setFormData={vi.fn()} />);
    expect(screen.getByText(/No mentor data available/i)).toBeInTheDocument();
  });
});
