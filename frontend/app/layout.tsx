import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";
import { I18nProvider } from "@/lib/i18n";

const roboto = Roboto({ 
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Queue Management System",
  description: "Universal Queue Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.className}>
        <I18nProvider>
          <ThemeProvider>
            <ConfirmDialogProvider>
              {children}
              <SessionTimeoutWarning />
            </ConfirmDialogProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
