import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostLab",
  description: "Advanced Tweet Simulation & Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className="antialiased bg-background text-foreground"
      >
        {children}
      </body>
    </html>
  );
}
