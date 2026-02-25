"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step2() {
    const router = useRouter();
    const { dp, updateDP } = useDP();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateDP((prev) => ({
            ...prev,
            travaux: { ...prev.travaux, [name]: value },
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateDP((prev) => ({
            ...prev,
            travaux: { ...prev.travaux, [name]: parseFloat(value) || 0 },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/3");
    };

    return (
        <div className="wizard-container">
            <Progress step={2} totalSteps={5} />

            <form onSubmit={handleSubmit} className="wizard-form">
                <div className="form-header">
                    <h2>🏗️ Nature du projet</h2>
                    <p className="form-description">
                        Décrivez brièvement les travaux envisagés. L'IA se chargera de rédiger la notice descriptive complète (DP11) à l'étape 4.
                    </p>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Description globale</h3>

                    <div className="form-group form-group-full">
                        <label htmlFor="type_travaux">Type de travaux (cocher ou sélectionner)</label>
                        <select name="type_travaux" id="type_travaux" value={dp.travaux.type_travaux} onChange={handleChange}>
                            <option value="Modification de l'aspect extérieur">Modification de l'aspect extérieur (ravalement, fenêtres, toiture...)</option>
                            <option value="Extension">Extension (véranda, pièce supplémentaire)</option>
                            <option value="Piscine">Piscine non couverte</option>
                            <option value="Clôture">Édification d'une clôture ou d'un mur</option>
                            <option value="Changement de destination">Changement de destination</option>
                        </select>
                    </div>

                    <div className="form-group form-group-full">
                        <label htmlFor="description_courte">Courte description de votre projet</label>
                        <textarea
                            name="description_courte"
                            id="description_courte"
                            rows={3}
                            placeholder="Ex: Remplacement des fenêtres en bois par des menuiseries PVC blanc, réfection de la toiture à l'identique..."
                            value={dp.travaux.description_courte}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Surfaces et Emprise (m²)</h3>
                    <p className="form-description" style={{ marginBottom: "1.5rem" }}>
                        Si les travaux ne modifient pas les surfaces (ex: ravalement, changement de menuiseries), laissez la surface créée à 0.
                    </p>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="surface_plancher_existante">Surface de plancher existante</label>
                            <input type="number" step="0.1" name="surface_plancher_existante" id="surface_plancher_existante" value={dp.travaux.surface_plancher_existante} onChange={handleNumberChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="surface_plancher_creee">Surface de plancher CRÉÉE</label>
                            <input type="number" step="0.1" name="surface_plancher_creee" id="surface_plancher_creee" value={dp.travaux.surface_plancher_creee} onChange={handleNumberChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="emprise_au_sol_existante">Emprise au sol existante</label>
                            <input type="number" step="0.1" name="emprise_au_sol_existante" id="emprise_au_sol_existante" value={dp.travaux.emprise_au_sol_existante} onChange={handleNumberChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="emprise_au_sol_creee">Emprise au sol CRÉÉE</label>
                            <input type="number" step="0.1" name="emprise_au_sol_creee" id="emprise_au_sol_creee" value={dp.travaux.emprise_au_sol_creee} onChange={handleNumberChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hauteur_existante">Hauteur existante de la façade (m)</label>
                            <input type="number" step="0.1" name="hauteur_existante" id="hauteur_existante" value={dp.travaux.hauteur_existante} onChange={handleNumberChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hauteur_projetee">Hauteur projetée (m)</label>
                            <input type="number" step="0.1" name="hauteur_projetee" id="hauteur_projetee" value={dp.travaux.hauteur_projetee} onChange={handleNumberChange} />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => router.push("/etape/1")}>← Précédent</button>
                    <button type="submit" className="btn btn-primary">Suivant →</button>
                </div>
            </form>
        </div>
    );
}
