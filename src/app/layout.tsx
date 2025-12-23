import type { Metadata } from "next";
import React from "react";
import { AuthProvider } from '@/contexts/AuthContext'; 
import "./globals.css";
import CustomToaster from "@/components/ui/toaster"; 
import AuthLoader from "@/components/auth/AuthLoader";
export const metadata: Metadata = {
  title: "Promo Bandhu Admin",
  description: "Admin dashboard to manage businesses, offers & subscriptions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-purple-500  antialiased" suppressHydrationWarning>
        <AuthProvider>
           <AuthLoader />
          {children}
          <CustomToaster />
        </AuthProvider>
      </body>
    </html>
  );
}