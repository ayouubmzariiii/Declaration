"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step6() {
    const router = useRouter();
    const { dp } = useDP();
    const [orientation, setOrientation] = useState("portrait");
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const res = await fetch("/api/telecharger-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dp, orientation }),
            });

            if (!res.ok) throw new Error("Erreur de génération du PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${dp.reference}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création du PDF. Veuillez réessayer.");
        } finally {
            setDownloading(false);
        }
    };

    const handleCerfaDownload = async () => {
        try {
            setDownloading(true);
            const res = await fetch("/api/generate-cerfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dp }),
            });

            if (!res.ok) throw new Error("Erreur de génération du Cerfa PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `cerfa_${dp.reference}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création du Cerfa. Veuillez réessayer.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="wizard-container">
            <Progress step={6} totalSteps={6} />

            <div className="wizard-form">
                <div className="form-header">
                    <h2>📄 Récapitulatif du dossier</h2>
                    <p className="form-description">Vérifiez les informations avant de générer votre dossier PDF</p>
                </div>

                {/* Demandeur */}
                <div className="summary-section">
                    <h3 className="summary-title">👤 Demandeur</h3>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Identité</span><span className="value">{dp.demandeur.civilite} {dp.demandeur.prenom} {dp.demandeur.nom}</span></div>
                        <div className="summary-item"><span className="label">Adresse</span><span className="value">{dp.demandeur.adresse}, {dp.demandeur.code_postal} {dp.demandeur.ville}</span></div>
                        <div className="summary-item"><span className="label">Contact</span><span className="value">{dp.demandeur.telephone} — {dp.demandeur.email}</span></div>
                        <div className="summary-item"><span className="label">Qualité</span><span className="value">{dp.demandeur.qualite}</span></div>
                    </div>
                </div>

                {/* Terrain */}
                <div className="summary-section">
                    <h3 className="summary-title">📍 Terrain</h3>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Adresse</span><span className="value">{dp.terrain.adresse}, {dp.terrain.code_postal} {dp.terrain.commune}</span></div>
                        <div className="summary-item"><span className="label">Cadastre</span><span className="value">Section {dp.terrain.section_cadastrale}, Parcelle n°{dp.terrain.numero_parcelle}</span></div>
                        <div className="summary-item"><span className="label">Superficie</span><span className="value">{dp.terrain.superficie_terrain} m²</span></div>
                        <div className="summary-item"><span className="label">Zone PLU</span><span className="value">{dp.terrain.zone_plu}</span></div>
                    </div>
                </div>

                {/* Travaux */}
                <div className="summary-section">
                    <h3 className="summary-title">🔨 Travaux</h3>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Type</span><span className="value">{dp.travaux.type_travaux}</span></div>
                        <div className="summary-item"><span className="label">Description</span><span className="value">{dp.travaux.description_courte}</span></div>
                        <div className="summary-item"><span className="label">Surfaces</span><span className="value">Existante : {dp.travaux.surface_plancher_existante} m² — Créée : {dp.travaux.surface_plancher_creee} m²</span></div>
                        <div className="summary-item"><span className="label">Calendrier</span><span className="value">Début : {dp.travaux.date_debut_prevue} — Durée : {dp.travaux.duree_travaux_mois} mois</span></div>
                    </div>
                </div>

                {/* Notice */}
                <div className="summary-section">
                    <h3 className="summary-title">📝 Notice descriptive</h3>
                    <div className="summary-text-block">
                        {dp.notice.etat_initial && (
                            <>
                                <h4>État initial</h4>
                                <p>{dp.notice.etat_initial}</p>
                            </>
                        )}
                        {dp.notice.etat_projete && (
                            <>
                                <h4>État projeté</h4>
                                <p>{dp.notice.etat_projete}</p>
                            </>
                        )}
                        {dp.notice.justification && (
                            <>
                                <h4>Justification</h4>
                                <p>{dp.notice.justification}</p>
                            </>
                        )}
                        {!dp.notice.etat_initial && !dp.notice.etat_projete && (
                            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Aucune notice générée — retournez à l'étape IA</p>
                        )}
                    </div>
                </div>

                {/* Photos */}
                <div className="summary-section">
                    <h3 className="summary-title">📷 Photos ({dp.photo_sets.length} paire{dp.photo_sets.length > 1 ? 's' : ''})</h3>
                    <div className="summary-grid">
                        {dp.photo_sets.map((ps, idx) => (
                            <div key={idx} className="summary-item">
                                <span className="label">{ps.label}</span>
                                <span className="value">Avant{ps.base64_avant ? ' ✓' : ' —'} / Après{ps.base64_apres ? ' ✓' : ' —'}</span>
                            </div>
                        ))}
                        {dp.photo_sets.length === 0 && (
                            <div className="summary-item"><span className="label">—</span><span className="value">Aucune photo</span></div>
                        )}
                    </div>
                </div>

                {/* Pièces jointes */}
                <div className="summary-section">
                    <h3 className="summary-title">📋 Pièces jointes</h3>
                    <div className="pieces-list">
                        {Object.entries({
                            ...dp.pieces_jointes,
                            "DP1": { ...dp.pieces_jointes["DP1"], fourni: true },
                            "DP2": { ...dp.pieces_jointes["DP2"], fourni: !!dp.plans?.dp2_base64 },
                            "DP3": { ...dp.pieces_jointes["DP3"], fourni: !!dp.plans?.dp3_base64 },
                            "DP4": { ...dp.pieces_jointes["DP4"], fourni: !!dp.plans?.dp4_base64 },
                            "DP7": { ...dp.pieces_jointes["DP7"], fourni: dp.photo_sets.length > 0 },
                            "DP8": { ...dp.pieces_jointes["DP8"], fourni: dp.photo_sets.length > 0 },
                            "DP11": { ...dp.pieces_jointes["DP11"], fourni: !!(dp.notice.etat_initial || dp.notice.etat_projete) },
                        }).map(([ref, info]) => (
                            <div key={ref} className={`piece-item ${info.fourni ? 'piece-fourni' : 'piece-manquant'}`}>
                                <span className="piece-ref">{ref}</span>
                                <span className="piece-nom">{info.nom}</span>
                                <span className="piece-statut">{info.fourni ? '✓' : '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PDF Export */}
                <div className="export-section">
                    <div className="export-card">
                        <div className="export-icon">📥</div>
                        <h3>Générer le dossier PDF</h3>
                        <p>Choisissez l'orientation du document :</p>
                        <div className="theme-selector" style={{ marginBottom: '20px' }}>
                            <label className="theme-option">
                                <input type="radio" name="pdf_orientation" value="portrait" checked={orientation === "portrait"} onChange={(e) => setOrientation(e.target.value)} />
                                <div className="theme-card">
                                    <span className="theme-name">Vertical (Portrait)</span>
                                </div>
                            </label>
                            <label className="theme-option">
                                <input type="radio" name="pdf_orientation" value="landscape" checked={orientation === "landscape"} onChange={(e) => setOrientation(e.target.value)} />
                                <div className="theme-card">
                                    <span className="theme-name">Horizontal (Paysage)</span>
                                </div>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-lg"
                                style={{ opacity: downloading ? "0.7" : "1" }}
                                onClick={handleCerfaDownload}
                                disabled={downloading}
                            >
                                {downloading ? "⏳..." : "📄 Télécharger le CERFA"}
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary btn-lg"
                                style={{ opacity: downloading ? "0.7" : "1" }}
                                onClick={handleDownload}
                                disabled={downloading}
                            >
                                {downloading ? "⏳ Génération en cours..." : "Télécharger le Dossier →"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/5")}>← Modifier les plans</button>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/")}>Terminer</button>
                </div>
            </div>
        </div>
    );
}
