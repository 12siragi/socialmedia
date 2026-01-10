// src/components/authentication/__tests__/LoginForm.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom"; // for router context
import LoginForm from "../../../components/forms/LoginForm"; // correct path to LoginForm

describe("LoginForm", () => {
  it("calls form submit when submit button is clicked", async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const form = document.getElementById("login-form");
    const submitButton = within(form).getByRole("button", { name: /submit/i });

    const handleSubmit = vi.fn((e) => e.preventDefault());
    form.addEventListener("submit", handleSubmit);

    const user = userEvent.setup();
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows validation error if fields are empty", async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const form = document.getElementById("login-form");
    const submitButton = within(form).getByRole("button", { name: /submit/i });

    const user = userEvent.setup();
    await user.click(submitButton);

    await waitFor(() => {
      expect(within(form).getByText(/this field is required/i)).toBeInTheDocument();
    });
  });

  it("allows user to enter email and password", async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const form = document.getElementById("login-form");
    const emailInput = within(form).getByPlaceholderText(/enter email/i);
    const passwordInput = within(form).getByPlaceholderText(/password/i);

    const user = userEvent.setup();
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
});
