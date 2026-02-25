import type { Metadata } from "next";
import "./globals.css";
import { DPProvider } from "@/context/DPContext";

export const metadata: Metadata = {
  title: "Déclaration Préalable SaaS",
  description: "L'IA qui prépare votre dossier de Déclaration Préalable de Travaux.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DPProvider>
          <nav className="navbar">
            <div className="navbar-brand">
              <div className="navbar-logo">
                <span className="logo-icon">🏛️</span>
                <span className="logo-text">DP<span className="logo-accent">SaaS</span></span>
              </div>
              <span className="navbar-tagline">Déclaration Préalable intelligente</span>
            </div>
            <div className="navbar-actions">
              <a href="/" className="nav-link">Accueil</a>
              <a href="/etape/1" className="btn btn-nav">+ Nouvelle DP</a>
            </div>
          </nav>

          <main className="main-content">
            {children}
          </main>
        </DPProvider>
      </body>
    </html>
  );
}
