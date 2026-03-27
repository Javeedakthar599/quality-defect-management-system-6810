import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders dashboard", () => {
  render(<App />);
  // Sidebar also contains "Dashboard" nav item; assert the main page heading instead.
  const heading = screen.getByRole("heading", { name: /dashboard/i, level: 1 });
  expect(heading).toBeInTheDocument();
});
