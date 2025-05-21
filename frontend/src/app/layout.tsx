import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Assuming Navbar will be created

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GenAI Content Labeling",
  description: "Assists in labeling web content as AI-generated or human-generated.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <Navbar />
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
