import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  it("renders Welcome to Postagram text", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/welcome to postagram/i)
    ).toBeInTheDocument();
  });
});
