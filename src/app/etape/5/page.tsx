"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step5() {
    const router = useRouter();
    const { dp, updateDP } = useDP();

    const handlePlanChange = (planKey: "dp2" | "dp3" | "dp4", field: "mode" | "base64", value: string | null) => {
        updateDP((prev) => ({
            ...prev,
            plans: {
                ...prev.plans,
                [`${planKey}_${field}`]: value
            }
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, planKey: "dp2" | "dp3" | "dp4") => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handlePlanChange(planKey, "base64", reader.result as string);
                handlePlanChange(planKey, "mode", "upload");
            };
            reader.readAsDataURL(file);
        }
    };

    const setAiMode = (planKey: "dp2" | "dp3" | "dp4", defaultImg: string) => {
        handlePlanChange(planKey, "mode", "ai");
        handlePlanChange(planKey, "base64", defaultImg);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/6");
    };

    const renderPlanSection = (title: string, desc: string, planKey: "dp2" | "dp3" | "dp4", defaultImg: string) => {
        const currentMode = dp.plans[`${planKey}_mode`];
        const currentImg = dp.plans[`${planKey}_base64`];

        return (
            <div className="form-section">
                <h3 className="form-section-title">{title}</h3>
                <p className="form-description" style={{ marginBottom: "15px" }}>{desc}</p>

                <div className="radio-group" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name={`${planKey}_mode`}
                            checked={currentMode === "ai"}
                            onChange={() => setAiMode(planKey, defaultImg)}
                        />
                        <strong>Générer avec l'IA</strong> (Bêta)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name={`${planKey}_mode`}
                            checked={currentMode === "upload"}
                            onChange={() => {
                                handlePlanChange(planKey, "mode", "upload");
                                if (currentImg === defaultImg) handlePlanChange(planKey, "base64", null);
                            }}
                        />
                        <strong>Téléverser mon propre plan</strong>
                    </label>
                </div>

                {currentMode === "upload" && (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label
                            htmlFor={`file-upload-${planKey}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed var(--border-color)',
                                borderRadius: '8px',
                                padding: '20px',
                                cursor: 'pointer',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
                            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                        >
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>📤</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-color)' }}>
                                {currentImg && currentImg !== defaultImg ? "Remplacer l'image" : "Cliquez pour uploader votre plan"}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                Formats acceptés : JPG, PNG, PDF (max 5 Mo)
                            </span>
                            <input
                                id={`file-upload-${planKey}`}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileUpload(e, planKey)}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                )}

                {currentImg && (
                    <div className="image-preview" style={{ marginTop: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9f9f9', textAlign: 'center', padding: '10px' }}>
                        <img
                            src={currentImg}
                            alt={`Aperçu ${title}`}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                        />
                        {currentMode === "ai" && <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>✨ Plan pré-généré par l'IA</div>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="wizard-container">
            <Progress step={5} totalSteps={6} />

            <form onSubmit={handleSubmit} className="wizard-form">
                <div className="form-header">
                    <h2>🏗️ Plans Architecturaux (DP2, DP3, DP4)</h2>
                    <p className="form-description">
                        Vous pouvez fournir vos propres plans pour le dossier, ou confier la génération de ces documents à notre intelligence artificielle.
                    </p>
                </div>

                {renderPlanSection(
                    "DP2 - Plan de masse",
                    "Vue aérienne du projet et de la parcelle, distances aux limites séparatives.",
                    "dp2",
                    "/plans/plan de mass.png"
                )}

                {renderPlanSection(
                    "DP3 - Plan en coupe",
                    "Coupe verticale du bâtiment montrant l'implantation sur le terrain naturel.",
                    "dp3",
                    "/plans/plan de coupe.png"
                )}

                {renderPlanSection(
                    "DP4 - Plan des façades et toitures",
                    "Élévation architecturale détaillée des façades modifiées par votre projet.",
                    "dp4",
                    "/plans/plan des facades.png"
                )}

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/4")}>← Retour</button>
                    <button type="submit" className="btn btn-primary">Continuer vers les infos Cerfa →</button>
                </div>
            </form>
        </div>
    );
}
