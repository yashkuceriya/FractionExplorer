import type { Metadata, Viewport } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import { StudentProvider } from "@/lib/student-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "FractionLab",
  description: "Learn fractions by exploring — split, merge, compare, and discover equivalence!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "FractionLab",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface min-h-dvh antialiased">
        <StudentProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </StudentProvider>
      </body>
    </html>
  );
}
