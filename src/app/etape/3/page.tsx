"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";
import { Trash2 } from "lucide-react";

export default function Step3() {
    const router = useRouter();
    const { dp, updateDP } = useDP();
    const [loading, setLoading] = useState(false);

    // Convert File to Base64 String
    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handleAddPair = () => {
        updateDP((prev) => ({
            ...prev,
            photo_sets: [
                ...prev.photo_sets,
                {
                    label: "Nouvelle vue",
                    chemin_avant: "",
                    chemin_apres: "",
                    description_avant: "",
                    description_apres: "",
                    base64_avant: null,
                    base64_apres: null,
                },
            ],
        }));
    };

    const handleRemovePair = (index: number) => {
        updateDP((prev) => {
            const newSets = [...prev.photo_sets];
            newSets.splice(index, 1);
            return { ...prev, photo_sets: newSets };
        });
    };

    const handleLabelChange = (index: number, value: string) => {
        updateDP((prev) => {
            const newSets = [...prev.photo_sets];
            newSets[index].label = value;
            return { ...prev, photo_sets: newSets };
        });
    };

    const handleFileUpload = async (index: number, type: "avant" | "apres", file: File | null) => {
        if (!file) return;
        try {
            setLoading(true);
            const base64 = await toBase64(file);
            updateDP((prev) => {
                const newSets = [...prev.photo_sets];
                if (type === "avant") {
                    newSets[index].base64_avant = base64;
                    newSets[index].chemin_avant = file.name; // Store name for reference
                } else {
                    newSets[index].base64_apres = base64;
                    newSets[index].chemin_apres = file.name; // Store name for reference
                }
                return { ...prev, photo_sets: newSets };
            });
        } catch (err) {
            console.error("Failed to convert file to base64", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/4");
    };

    return (
        <div className="wizard-container">
            <Progress step={3} totalSteps={5} />

            <form onSubmit={handleSubmit} className="wizard-form">
                <div className="form-header">
                    <h2>📷 Reportage photographique</h2>
                    <p className="form-description">
                        Ajoutez vos photos par paires : pour chaque emplacement (façade, pignon, etc.),
                        fournissez la photo <strong>avant</strong> et <strong>après</strong> travaux.
                        L'IA comparera chaque paire à l'étape suivante.
                    </p>
                </div>

                <div id="photo-sets-container">
                    {dp.photo_sets.map((ps, idx) => (
                        <div key={idx} className="photo-set">
                            <div className="photo-set-header">
                                <div className="set-label-row">
                                    <span className="set-number">Paire #{idx + 1}</span>
                                    <input
                                        type="text"
                                        className="set-label-input"
                                        value={ps.label}
                                        onChange={(e) => handleLabelChange(idx, e.target.value)}
                                        placeholder="Ex : Façade principale"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => handleRemovePair(idx)}
                                    title="Supprimer cette paire"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="photo-pair-row">
                                {/* Photo Avant */}
                                <div className="photo-pair-col">
                                    <div className="pair-label">📸 Avant travaux</div>
                                    <div className="photo-upload-card" onClick={() => document.getElementById(`file-avant-${idx}`)?.click()}>
                                        <input
                                            type="file"
                                            id={`file-avant-${idx}`}
                                            accept="image/*"
                                            className="file-input"
                                            onChange={(e) => handleFileUpload(idx, "avant", e.target.files?.[0] || null)}
                                            disabled={loading}
                                        />
                                        {ps.base64_avant ? (
                                            <img src={ps.base64_avant} alt="Aperçu avant" className="preview-img" />
                                        ) : (
                                            <div className="upload-placeholder">
                                                <span className="upload-icon">📷</span>
                                                <span>Cliquez pour sélectionner</span>
                                            </div>
                                        )}
                                    </div>
                                    {ps.base64_avant && (
                                        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleFileUpload(idx, "avant", null)}>
                                                Changer la photo
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Photo Après */}
                                <div className="photo-pair-col">
                                    <div className="pair-label">🏗️ Après travaux</div>
                                    <div className="photo-upload-card" onClick={() => document.getElementById(`file-apres-${idx}`)?.click()}>
                                        <input
                                            type="file"
                                            id={`file-apres-${idx}`}
                                            accept="image/*"
                                            className="file-input"
                                            onChange={(e) => handleFileUpload(idx, "apres", e.target.files?.[0] || null)}
                                            disabled={loading}
                                        />
                                        {ps.base64_apres ? (
                                            <img src={ps.base64_apres} alt="Aperçu après" className="preview-img" />
                                        ) : (
                                            <div className="upload-placeholder">
                                                <span className="upload-icon">📷</span>
                                                <span>Cliquez pour sélectionner</span>
                                            </div>
                                        )}
                                    </div>
                                    {ps.base64_apres && (
                                        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleFileUpload(idx, "apres", null)}>
                                                Changer la photo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {dp.photo_sets.length > 0 && (
                    <div className="existing-photos">
                        <p className="existing-label">Paires actuellement enregistrées :</p>
                        {dp.photo_sets.map((ps, idx) => (
                            <span key={idx} className="photo-badge">✓ {ps.label}</span>
                        ))}
                    </div>
                )}

                <div className="set-add-row">
                    <button type="button" className="btn-add" onClick={handleAddPair}>
                        + Ajouter une paire avant/après
                    </button>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/2")}>
                        ← Précédent
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={dp.photo_sets.length === 0 || loading}>
                        Suivant — Analyse IA →
                    </button>
                </div>
            </form>
        </div>
    );
}
