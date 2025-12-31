import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Darth's Dash - A Fun Platformer Game",
  description: "Help cartoon Darth Vader dodge flying Baby Yodas in this fun side-scrolling adventure!",
  keywords: ["game", "platformer", "kids", "fun", "browser game"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
