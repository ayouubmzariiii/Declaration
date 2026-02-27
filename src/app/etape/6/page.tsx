"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step6() {
    const router = useRouter();
    const { dp, updateDP } = useDP();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateDP(prev => ({
            ...prev,
            cerfa: {
                ...prev.cerfa,
                [name]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/7");
    };

    return (
        <div className="wizard-container">
            <Progress step={6} totalSteps={7} />

            <form onSubmit={handleSubmit} className="wizard-form">
                <div className="form-header">
                    <h2>📑 Informations complémentaires Cerfa</h2>
                    <p className="form-description">
                        Ces informations sont requises pour remplir automatiquement le formulaire administratif Cerfa.
                    </p>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Signature</h3>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="lieu_signature">Fait à (Lieu) *</label>
                            <input
                                type="text"
                                id="lieu_signature"
                                name="lieu_signature"
                                required
                                value={dp.cerfa?.lieu_signature || ""}
                                onChange={handleChange}
                                placeholder="ex: Paris"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="date_signature">Le (Date prévue de dépôt) *</label>
                            <input
                                type="date"
                                id="date_signature"
                                name="date_signature"
                                required
                                value={dp.cerfa?.date_signature ? dp.cerfa.date_signature.split('/').reverse().join('-') : ""}
                                onChange={(e) => {
                                    const dateVal = e.target.value;
                                    const formatted = dateVal ? new Date(dateVal).toLocaleDateString('fr-FR') : "";
                                    updateDP(prev => ({
                                        ...prev,
                                        cerfa: { ...prev.cerfa, date_signature: formatted }
                                    }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Informations Personne Morale (Optionnel)</h3>
                    <p className="form-description" style={{ marginBottom: "15px" }}>À remplir uniquement si le demandeur est une société.</p>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="denomination_sociale">Dénomination Sociale</label>
                            <input
                                type="text"
                                id="denomination_sociale"
                                name="denomination_sociale"
                                value={dp.cerfa?.denomination_sociale || ""}
                                onChange={handleChange}
                                placeholder="Raison sociale"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="siret">Numéro SIRET</label>
                            <input
                                type="text"
                                id="siret"
                                name="siret"
                                value={dp.cerfa?.siret || ""}
                                onChange={handleChange}
                                placeholder="14 chiffres"
                                maxLength={14}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Précisions sur le projet</h3>
                    <div className="form-group">
                        <label htmlFor="nature_precisions">Courte description supplémentaire du projet</label>
                        <textarea
                            id="nature_precisions"
                            name="nature_precisions"
                            value={dp.cerfa?.nature_precisions || ""}
                            onChange={handleChange}
                            placeholder="Si vous avez des précisions sur la nature des travaux..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/5")}>← Retour</button>
                    <button type="submit" className="btn btn-primary">Passer au résumé →</button>
                </div>
            </form>
        </div>
    );
}
