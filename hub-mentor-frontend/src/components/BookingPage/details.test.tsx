import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Details from "./details";

const formData = { studentName: "", email: "", phone: "", message: "" };

describe("Details (step 2)", () => {
  it("renders the student detail fields", () => {
    render(<Details formData={formData} handleInputChange={vi.fn()} setFormData={vi.fn()} />);
    expect(screen.getByText("Your details")).toBeInTheDocument();
    expect(screen.getByText("Student Name")).toBeInTheDocument();
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
  });

  it("shows the current form values", () => {
    render(
      <Details
        formData={{ ...formData, studentName: "Sam", email: "sam@test.com" }}
        handleInputChange={vi.fn()}
        setFormData={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Sam")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sam@test.com")).toBeInTheDocument();
  });
});
