"use client";

import Link from "next/link";
import { useDP } from "@/context/DPContext";

export default function Home() {
  const { resetDP } = useDP();

  return (
    <>
      <div className="landing">
        <div className="hero">
          <div className="hero-badge">🤖 Propulsé par l'IA</div>
          <h1 className="hero-title">
            Votre <span className="text-gradient">Déclaration Préalable</span><br />
            en quelques minutes
          </h1>
          <p className="hero-subtitle">
            Générez un dossier complet conforme aux exigences du Code l'urbanisme.
            Notre IA analyse vos photos et rédige les descriptions techniques.
          </p>

          <Link
            href="/etape/1"
            className="btn btn-primary btn-lg"
            onClick={() => resetDP()} // Reset state when starting a new dossier
          >
            Commencer ma déclaration →
          </Link>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">📷</div>
            <h3>Analyse photo IA</h3>
            <p>Uploadez vos photos avant/après, l'IA détecte les matériaux et génère les descriptions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Notice automatique</h3>
            <p>La notice descriptive est rédigée automatiquement conformément aux attentes administratives.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>PDF professionnel</h3>
            <p>Export PDF prêt à déposer en mairie, avec toutes les pièces indexées.</p>
          </div>
        </div>
      </div>

      <div className="info-box">
        <strong>💡 Pourquoi utiliser cet outil ?</strong><br />
        La rédaction de la notice descriptive (pièce DP11) est souvent la cause principale de rejet des dossiers en mairie par manque de précision. Notre IA garantit le vocabulaire architectural attendu par les instructeurs (urbanisme).
      </div>
    </>
  );
}
