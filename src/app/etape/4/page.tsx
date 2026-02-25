"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step4() {
    const router = useRouter();
    const { dp, updateDP } = useDP();

    const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [statusText, setStatusText] = useState("Envoi des photos au modèle d'IA...");

    // AI Customization state
    const [testModel, setTestModel] = useState("nemotron");
    const [testTemp, setTestTemp] = useState(0.3);
    const [testTokens, setTestTokens] = useState(4096);
    const [testPrompt, setTestPrompt] = useState("");

    const models = {
        nemotron: "Rapide et Efficace",
        qwen: "Lent et (accurate)"
    };

    useEffect(() => {
        // Generate default prompt preview on mount
        const projetInfo = {
            adresse: dp.terrain.adresse,
            commune: dp.terrain.commune,
            zone_plu: dp.terrain.zone_plu,
            type_travaux: dp.travaux.type_travaux,
            surface_existante: dp.travaux.surface_plancher_existante
        };

        setTestPrompt(`Analyse ces photos avec une précision architecturale et réglementaire maximale.

INFORMATIONS DU PROJET :
- Adresse : ${projetInfo.adresse}
- Commune : ${projetInfo.commune}
- Zone PLU : ${projetInfo.zone_plu}
- Type : ${projetInfo.type_travaux}
- Surface déclarée : ${projetInfo.surface_existante} m²

MISSION CRUCIALE :
Compare minutieusement l'avant et l'après.
Identifie CHAQUE modification physique visible.
Distingue clairement :
- Modifications esthétiques (couleur, texture, finition)
- Modifications géométriques (dimensions, hauteur, volume)
- Modifications structurelles (ouvertures créées/supprimées, extensions, démolitions)

Ignore totalement les éléments temporaires (météo, végétation, véhicules, ombres).

Détecte explicitement :
- Création, suppression ou modification d'ouvertures
- Modification du volume général
- Modification de l'emprise au sol
- Modification estimée de la surface de plancher

Évalue la cohérence architecturale avec un environnement résidentiel urbain typique d'une zone UB.
Signale tout risque réglementaire potentiel.
Si un élément n'est pas clairement identifiable visuellement, indique "non déterminable visuellement".
Pour chaque détection matérielle ou colorimétrique, indique un niveau de confiance (faible, moyen, élevé).

Retourne un objet JSON PLAT avec EXACTEMENT ces clés au premier niveau :
{
  "etat_initial": "...",
  "etat_projete": "...",
  "modifications_detaillees": "...",
  "modification_volume": "...",
  "modification_emprise_au_sol": "...",
  "modification_surface_plancher": "...",
  "nombre_ouvertures_existantes": "...",
  "nombre_ouvertures_projetees": "...",
  "hauteur_estimee_existante": "...",
  "hauteur_estimee_projete": "...",
  "justification": "...",
  "coherence_architecturale": "...",
  "insertion_paysagere": "...",
  "impact_environnemental": "...",
  "risques_reglementaires_potentiels": "...",
  "facade_materiaux_existants": "... (avec niveau de confiance)",
  "facade_materiaux_projetes": "... (avec niveau de confiance)",
  "menuiseries_existantes": "... (avec niveau de confiance)",
  "menuiseries_projetees": "... (avec niveau de confiance)",
  "toiture_materiaux_existants": "... (avec niveau de confiance)",
  "toiture_materiaux_projetes": "... (avec niveau de confiance)",
  "couleur_facade": "... (RAL estimé si possible + confiance)",
  "couleur_menuiseries": "... (RAL estimé si possible + confiance)",
  "couleur_volets": "... (RAL estimé si possible + confiance)",
  "couleur_toiture": "... (RAL estimé si possible + confiance)",
  "niveau_confiance_global": "..."
}

RÈGLES STRICTES :
- Réponds UNIQUEMENT avec le JSON.
- PAS de sous-objets.
- COMMENCE par { et FINIS par }.
- PAS de texte avant ou après.`);
    }, [dp]);

    const lancerAnalyse = async () => {
        setAiStatus("loading");
        setErrorMsg("");

        const steps = [
            "Envoi des photos au modèle d'IA...",
            "Analyse des matériaux et couleurs...",
            "Génération de la notice descriptive...",
            "Rédaction des justifications..."
        ];
        let stepIdx = 0;
        const interval = setInterval(() => {
            stepIdx = Math.min(stepIdx + 1, steps.length - 1);
            setStatusText(steps[stepIdx]);
        }, 5000);

        try {
            const payload = {
                model: testModel,
                custom_prompt: testPrompt,
                temperature: testTemp,
                max_tokens: testTokens,
                photos_avant: dp.photo_sets.map(p => p.base64_avant).filter(Boolean),
                photos_apres: dp.photo_sets.map(p => p.base64_apres).filter(Boolean),
                projet_info: {
                    adresse: dp.terrain.adresse,
                    commune: dp.terrain.commune,
                    code_postal: dp.terrain.code_postal,
                    zone_plu: dp.terrain.zone_plu,
                    type_travaux: dp.travaux.type_travaux,
                    description: dp.travaux.description_courte,
                    surface_existante: dp.travaux.surface_plancher_existante
                }
            };

            const res = await fetch("/api/analyser-photos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            clearInterval(interval);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Erreur serveur (${res.status})`);
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Erreur inconnue");

            updateDP((prev) => ({
                ...prev,
                notice: { ...prev.notice, ...data.notice },
                aspect_exterieur: { ...prev.aspect_exterieur, ...data.aspect }
            }));
            setAiStatus("success");

        } catch (err: any) {
            clearInterval(interval);
            setErrorMsg(err.message || "Erreur lors de l'analyse");
            setAiStatus("error");
        }
    };

    const handleNoticeChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        updateDP((prev) => ({ ...prev, notice: { ...prev.notice, [name]: value } }));
    };

    const handleAspectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateDP((prev) => ({ ...prev, aspect_exterieur: { ...prev.aspect_exterieur, [name]: value } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/5");
    };

    return (
        <div className="wizard-container">
            <Progress step={4} totalSteps={5} />

            <form onSubmit={handleSubmit} className="wizard-form" id="reviewForm">
                <div className="form-header">
                    <h2>🤖 Analyse IA et revue des descriptions</h2>
                    <p className="form-description">
                        Lancez l'analyse IA pour générer automatiquement la notice descriptive
                        et les informations sur les matériaux à partir de vos photos.
                        Vous pourrez ensuite modifier les textes avant validation.
                    </p>
                </div>

                {/* AI Launch Logic */}
                <div className="ai-launch-section">
                    {aiStatus === "idle" && (
                        <div className="ai-launch-card" id="ai-launch-card">
                            <div className="ai-launch-icon">🤖</div>
                            <h3>Lancer l'analyse par intelligence artificielle</h3>
                            <p>L'IA va analyser vos {dp.photo_sets.length} paire(s) de photos et générer la notice descriptive, les matériaux détectés et les couleurs identifiées.</p>

                            <div className="form-group" style={{ margin: "1.5rem auto", maxWidth: "350px" }}>
                                <label htmlFor="ai_model" style={{ textAlign: "left", display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Modèle d'IA :
                                </label>
                                <select
                                    id="ai_model"
                                    className="form-input"
                                    style={{ width: "100%", borderColor: "var(--teal-secondary)" }}
                                    value={testModel}
                                    onChange={(e) => setTestModel(e.target.value)}
                                >
                                    {Object.entries(models).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>

                            <button type="button" className="btn btn-primary btn-lg" id="btn-launch-ai" onClick={lancerAnalyse}>
                                🚀 Lancer l'analyse IA
                            </button>
                        </div>
                    )}

                    {aiStatus === "loading" && (
                        <div id="ai-progress" className="ai-progress">
                            <div className="ai-progress-spinner">
                                <div className="spinner-large"></div>
                            </div>
                            <div className="ai-progress-text">
                                <h3>Analyse en cours...</h3>
                                <p id="ai-status-text">{statusText}</p>
                            </div>
                        </div>
                    )}

                    {aiStatus === "success" && (
                        <div id="ai-done" className="ai-done">
                            <div className="ai-done-icon">✅</div>
                            <p>Analyse terminée ! Vérifiez et modifiez les descriptions ci-dessous.</p>
                        </div>
                    )}

                    {aiStatus === "error" && (
                        <div id="ai-error" className="ai-error">
                            <div className="ai-error-icon">⚠️</div>
                            <p id="ai-error-text">{errorMsg}</p>
                            <button type="button" className="btn btn-secondary" onClick={lancerAnalyse}>Réessayer</button>
                        </div>
                    )}
                </div>

                {/* Editable Form after Success or if user wants to bypass */}
                <div style={{ display: aiStatus === "success" || aiStatus === "error" || aiStatus === "idle" ? "block" : "none" }}>

                    {/* Notice descriptive */}
                    <div className="form-section">
                        <h3 className="form-section-title">📝 Notice descriptive & Analyse technique</h3>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label>État initial du terrain et de la construction</label>
                                <textarea name="etat_initial" rows={3} value={dp.notice.etat_initial} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Description du projet (état projeté)</label>
                                <textarea name="etat_projete" rows={3} value={dp.notice.etat_projete} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Modifications détaillées détectées</label>
                                <textarea name="modifications_detaillees" rows={4} value={dp.notice.modifications_detaillees} onChange={handleNoticeChange} />
                            </div>

                            <div className="form-group">
                                <label>Hauteur estimée (existante)</label>
                                <input type="text" name="hauteur_estimee_existante" value={dp.notice.hauteur_estimee_existante} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group">
                                <label>Hauteur estimée (projetée)</label>
                                <input type="text" name="hauteur_estimee_projete" value={dp.notice.hauteur_estimee_projete} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group">
                                <label>Modification du volume</label>
                                <input type="text" name="modification_volume" value={dp.notice.modification_volume} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group">
                                <label>Modification de l'emprise au sol</label>
                                <input type="text" name="modification_emprise_au_sol" value={dp.notice.modification_emprise_au_sol} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group">
                                <label>Modification surface plancher</label>
                                <input type="text" name="modification_surface_plancher" value={dp.notice.modification_surface_plancher} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group">
                                <label>Confiance IA</label>
                                <input type="text" name="niveau_confiance_global" value={dp.notice.niveau_confiance_global} onChange={handleNoticeChange} />
                            </div>

                            <div className="form-group form-group-full">
                                <label>Cohérence architecturale (PLU/Zone)</label>
                                <textarea name="coherence_architecturale" rows={3} value={dp.notice.coherence_architecturale} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Risques réglementaires potentiels détectés</label>
                                <textarea name="risques_reglementaires_potentiels" rows={3} value={dp.notice.risques_reglementaires_potentiels} onChange={handleNoticeChange} />
                            </div>

                            <div className="form-group form-group-full">
                                <label>Justification du projet</label>
                                <textarea name="justification" rows={3} value={dp.notice.justification} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Insertion paysagère</label>
                                <textarea name="insertion_paysagere" rows={3} value={dp.notice.insertion_paysagere} onChange={handleNoticeChange} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Impact environnemental</label>
                                <textarea name="impact_environnemental" rows={3} value={dp.notice.impact_environnemental} onChange={handleNoticeChange} />
                            </div>
                        </div>
                    </div>

                    {/* Aspect extérieur */}
                    <div className="form-section">
                        <h3 className="form-section-title">🎨 Aspect extérieur détecté</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre d'ouvertures (existantes)</label>
                                <input type="text" name="nombre_ouvertures_existantes" value={dp.aspect_exterieur.nombre_ouvertures_existantes} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Nombre d'ouvertures (projetées)</label>
                                <input type="text" name="nombre_ouvertures_projetees" value={dp.aspect_exterieur.nombre_ouvertures_projetees} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Façade — Matériaux existants</label>
                                <input type="text" name="facade_materiaux_existants" value={dp.aspect_exterieur.facade_materiaux_existants} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Façade — Matériaux projetés</label>
                                <input type="text" name="facade_materiaux_projetes" value={dp.aspect_exterieur.facade_materiaux_projetes} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Menuiseries existantes</label>
                                <input type="text" name="menuiseries_existantes" value={dp.aspect_exterieur.menuiseries_existantes} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Menuiseries projetées</label>
                                <input type="text" name="menuiseries_projetees" value={dp.aspect_exterieur.menuiseries_projetees} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Toiture — Matériaux existants</label>
                                <input type="text" name="toiture_materiaux_existants" value={dp.aspect_exterieur.toiture_materiaux_existants} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Toiture — Matériaux projetés</label>
                                <input type="text" name="toiture_materiaux_projetes" value={dp.aspect_exterieur.toiture_materiaux_projetes} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Couleur façade</label>
                                <input type="text" name="couleur_facade" value={dp.aspect_exterieur.couleur_facade} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Couleur menuiseries</label>
                                <input type="text" name="couleur_menuiseries" value={dp.aspect_exterieur.couleur_menuiseries} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Couleur volets</label>
                                <input type="text" name="couleur_volets" value={dp.aspect_exterieur.couleur_volets} onChange={handleAspectChange} />
                            </div>
                            <div className="form-group">
                                <label>Couleur toiture</label>
                                <input type="text" name="couleur_toiture" value={dp.aspect_exterieur.couleur_toiture} onChange={handleAspectChange} />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/3")}>← Précédent</button>
                        <button type="submit" className="btn btn-primary">Valider et continuer →</button>
                    </div>
                </div>
            </form>

            {/* Testing Sidebar */}
            <div className="testing-sidebar" style={{ position: "fixed", top: "100px", right: "2rem", width: "320px", zIndex: 50, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
                <div className="wizard-form" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)" }}>
                    <div className="form-header" style={{ marginBottom: "1.5rem", paddingBottom: "0.8rem", borderBottom: "1px solid var(--border)" }}>
                        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>🛠️ Outils de test IA</h2>
                        <p className="form-description" style={{ fontSize: "0.8rem" }}>Personnalisez le prompt et les paramètres (avancé)</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label>Modèle</label>
                        <select value={testModel} onChange={(e) => setTestModel(e.target.value)} style={{ width: "100%", borderColor: "var(--teal-secondary)" }}>
                            {Object.entries(models).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label>Température ({testTemp})</label>
                        <input type="range" min="0" max="1" step="0.1" value={testTemp} onChange={(e) => setTestTemp(parseFloat(e.target.value))} />
                        <small style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "0.3rem" }}>0 = Strict et factuel<br />1 = Créatif et imprévisible</small>
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label>Max Tokens</label>
                        <input type="number" value={testTokens} onChange={(e) => setTestTokens(parseInt(e.target.value))} style={{ width: "100%" }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                        <label>Prompt système & utilisateur</label>
                        <textarea rows={12} value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} style={{ width: "100%", fontFamily: "monospace", fontSize: "0.75rem", resize: "vertical" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                        <button type="button" className="btn btn-primary" onClick={lancerAnalyse} style={{ width: "100%", justifyContent: "center" }}>Relancer l'analyse</button>
                    </div>
                </div>
            </div>

        </div>
    );
}
