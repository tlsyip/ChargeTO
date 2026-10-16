import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChargeTO — Overnight EV charging in Toronto",
  description:
    "Find and reserve a neighbourhood EV charging spot overnight. A fictional Toronto prototype with simulated bookings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
