import type { Metadata } from "next";
import "./globals.css";
import { Inter, Lora } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { SiteFooter } from "@/components/layout/site-footer";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "MyBlog",
  description: "An editorial black & white blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, lora.variable)}>
      <body className="flex min-h-screen flex-col antialiased">
        <NextTopLoader color="#000" height={3} showSpinner={false} shadow={false} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
