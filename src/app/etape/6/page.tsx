"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step6() {
    const router = useRouter();
    const { dp, updateDP } = useDP();

    useEffect(() => {
        let updates: any = {};
        let hasUpdates = false;

        // Auto-fill Location from Demandeur City
        if (!dp.cerfa?.lieu_signature && dp.demandeur?.ville) {
            updates.lieu_signature = dp.demandeur.ville;
            hasUpdates = true;
        }

        // Auto-fill Denomination Sociale if Demandeur is a Société
        if (!dp.cerfa?.denomination_sociale && dp.demandeur?.civilite === "Société" && dp.demandeur?.nom) {
            updates.denomination_sociale = dp.demandeur.nom;
            hasUpdates = true;
        }

        // Auto-fill Tax Surfaces from Travaux Surfaces
        let fiscUpdates: any = {};
        let hasFiscUpdates = false;

        if (dp.cerfa?.fiscalite?.surface_taxable_existante === 0 && dp.travaux?.surface_plancher_existante) {
            fiscUpdates.surface_taxable_existante = dp.travaux.surface_plancher_existante;
            hasFiscUpdates = true;
        }

        if (dp.cerfa?.fiscalite?.surface_taxable_creee === 0 && dp.travaux?.surface_plancher_creee) {
            fiscUpdates.surface_taxable_creee = dp.travaux.surface_plancher_creee;
            hasFiscUpdates = true;
        }

        if (hasFiscUpdates) {
            updates.fiscalite = {
                ...(dp.cerfa?.fiscalite || {}),
                ...fiscUpdates
            };
            hasUpdates = true;
        }

        if (hasUpdates) {
            updateDP(prev => ({
                ...prev,
                cerfa: {
                    ...prev.cerfa,
                    ...updates
                }
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reusable handler for top-level cerfa fields
    const handleCerfaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateDP(prev => ({
            ...prev,
            cerfa: {
                ...prev.cerfa,
                [name]: value
            }
        }));
    };

    // Handler for nested objects (co_demandeur, fiscalite, architecte)
    const handleNestedChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        section: 'co_demandeur' | 'fiscalite' | 'architecte'
    ) => {
        const { name, value, type, checked } = e.target;

        let finalValue: string | boolean | number = value;
        if (type === 'checkbox') finalValue = checked;
        if (type === 'number') finalValue = value === '' ? 0 : parseFloat(value);

        updateDP(prev => ({
            ...prev,
            cerfa: {
                ...prev.cerfa,
                [section]: {
                    ...(prev.cerfa[section] || {}),
                    [name]: finalValue
                }
            }
        }));
    };

    // Handler specifically for amenagements checkboxes
    const handleAmenagementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        updateDP(prev => ({
            ...prev,
            cerfa: {
                ...prev.cerfa,
                amenagements: {
                    piscine: prev.cerfa.amenagements?.piscine || false,
                    garage: prev.cerfa.amenagements?.garage || false,
                    veranda: prev.cerfa.amenagements?.veranda || false,
                    abri: prev.cerfa.amenagements?.abri || false,
                    extension: prev.cerfa.amenagements?.extension || false,
                    surelevation: prev.cerfa.amenagements?.surelevation || false,
                    cloture: prev.cerfa.amenagements?.cloture || false,
                    [name]: checked
                }
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
                    <h2>📑 Formulaire Cerfa - Données complètes</h2>
                    <p className="form-description">
                        Veuillez remplir ces informations détaillées pour permettre la génération parfaite de votre fichier Cerfa.
                    </p>
                </div>

                {/* --- CO-DEMANDEUR --- */}
                <div className="form-section">
                    <h3 className="form-section-title">Co-demandeur (Optionnel)</h3>
                    <p className="form-description" style={{ marginBottom: "15px" }}>Si le projet est porté par plusieurs personnes.</p>

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="co_civilite">Vous êtes</label>
                            <select
                                id="co_civilite"
                                name="civilite"
                                value={dp.cerfa?.co_demandeur?.civilite || "M."}
                                onChange={(e) => handleNestedChange(e as any, 'co_demandeur')}
                            >
                                <option value="M.">Un particulier - Monsieur</option>
                                <option value="Mme">Un particulier - Madame</option>
                                <option value="Société">Une personne morale (Société)</option>
                            </select>
                        </div>

                        {dp.cerfa?.co_demandeur?.civilite !== "Société" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="co_nom">Nom</label>
                                    <input type="text" id="co_nom" name="nom" value={dp.cerfa?.co_demandeur?.nom || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="ex: Martin" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_prenom">Prénom</label>
                                    <input type="text" id="co_prenom" name="prenom" value={dp.cerfa?.co_demandeur?.prenom || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="ex: Marie" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_date_naissance">Date de naissance</label>
                                    <input type="text" placeholder="JJ/MM/AAAA" id="co_date_naissance" name="date_naissance" value={dp.cerfa?.co_demandeur?.date_naissance || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_lieu_naissance">Commune de naissance</label>
                                    <input type="text" id="co_lieu_naissance" name="lieu_naissance" value={dp.cerfa?.co_demandeur?.lieu_naissance || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_departement_naissance">Département de naissance</label>
                                    <input type="text" placeholder="ex: 75" id="co_departement_naissance" name="departement_naissance" value={dp.cerfa?.co_demandeur?.departement_naissance || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_pays_naissance">Pays de naissance</label>
                                    <input type="text" id="co_pays_naissance" name="pays_naissance" value={dp.cerfa?.co_demandeur?.pays_naissance || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                </div>
                            </>
                        )}

                        {dp.cerfa?.co_demandeur?.civilite === "Société" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="co_nom_soc">Dénomination Sociale</label>
                                    <input type="text" id="co_nom_soc" name="nom" value={dp.cerfa?.co_demandeur?.nom || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="Nom de la société" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_type_societe">Type de société</label>
                                    <input type="text" id="co_type_societe" name="type_societe" value={dp.cerfa?.co_demandeur?.type_societe || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="SA, SCI, SARL..." />
                                </div>
                                <div className="form-group form-group-full">
                                    <strong style={{ display: 'block', marginBottom: '8px' }}>Représentant de la personne morale :</strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                        <select name="representant_civilite" value={dp.cerfa?.co_demandeur?.representant_civilite || "Monsieur"} onChange={(e) => handleNestedChange(e as any, 'co_demandeur')}>
                                            <option value="Monsieur">Monsieur</option>
                                            <option value="Madame">Madame</option>
                                        </select>
                                        <input type="text" name="representant_nom" placeholder="Nom" value={dp.cerfa?.co_demandeur?.representant_nom || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                        <input type="text" name="representant_prenom" placeholder="Prénom" value={dp.cerfa?.co_demandeur?.representant_prenom || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group form-group-full">
                            <label htmlFor="co_adresse">Adresse de correspondance</label>
                            <input type="text" id="co_adresse" name="adresse" value={dp.cerfa?.co_demandeur?.adresse || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="ex: 12 Rue de la République" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="co_cp">Code Postal</label>
                            <input type="text" id="co_cp" name="code_postal" value={dp.cerfa?.co_demandeur?.code_postal || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="ex: 75001" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="co_ville">Ville</label>
                            <input type="text" id="co_ville" name="ville" value={dp.cerfa?.co_demandeur?.ville || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="ex: Paris" />
                        </div>

                        <div className="form-group form-group-full checkbox-group" style={{ marginTop: '10px' }}>
                            <label className="checkbox-label" style={{ fontWeight: 500 }}>
                                <input type="checkbox" name="est_etranger" checked={dp.cerfa?.co_demandeur?.est_etranger || false} onChange={(e) => handleNestedChange(e as any, 'co_demandeur')} />
                                Le co-déclarant habite à l'étranger
                            </label>
                        </div>

                        {dp.cerfa?.co_demandeur?.est_etranger && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="co_pays_adresse">Pays</label>
                                    <input type="text" id="co_pays_adresse" name="pays_adresse" value={dp.cerfa?.co_demandeur?.pays_adresse || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="co_division_territoriale">Division territoriale</label>
                                    <input type="text" id="co_division_territoriale" name="division_territoriale" value={dp.cerfa?.co_demandeur?.division_territoriale || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} placeholder="État, Province..." />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="co_telephone">Téléphone</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {dp.cerfa?.co_demandeur?.est_etranger && (
                                    <input type="text" name="indicatif_telephone" placeholder="Indicatif" style={{ width: '100px' }} value={dp.cerfa?.co_demandeur?.indicatif_telephone || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                                )}
                                <input type="tel" id="co_telephone" name="telephone" style={{ flex: 1 }} value={dp.cerfa?.co_demandeur?.telephone || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="co_email">Adresse électronique</label>
                            <input type="email" id="co_email" name="email" value={dp.cerfa?.co_demandeur?.email || ""} onChange={(e) => handleNestedChange(e, 'co_demandeur')} />
                        </div>
                    </div>
                </div>

                {/* --- AMENAGEMENTS SPECIFIQUES --- */}
                <div className="form-section">
                    <h3 className="form-section-title">Aménagements spécifiques créés</h3>
                    <p className="form-description" style={{ marginBottom: "15px" }}>Cochez les éléments concernés par votre projet (si applicable).</p>
                    <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_piscine"
                                name="piscine"
                                checked={dp.cerfa?.amenagements?.piscine || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_piscine" style={{ margin: 0, fontWeight: 'normal' }}>Piscine</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_garage"
                                name="garage"
                                checked={dp.cerfa?.amenagements?.garage || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_garage" style={{ margin: 0, fontWeight: 'normal' }}>Garage</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_veranda"
                                name="veranda"
                                checked={dp.cerfa?.amenagements?.veranda || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_veranda" style={{ margin: 0, fontWeight: 'normal' }}>Véranda</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_abri"
                                name="abri"
                                checked={dp.cerfa?.amenagements?.abri || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_abri" style={{ margin: 0, fontWeight: 'normal' }}>Abri de jardin</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_extension"
                                name="extension"
                                checked={dp.cerfa?.amenagements?.extension || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_extension" style={{ margin: 0, fontWeight: 'normal' }}>Extension</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="am_surelevation"
                                name="surelevation"
                                checked={dp.cerfa?.amenagements?.surelevation || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_surelevation" style={{ margin: 0, fontWeight: 'normal' }}>Surélévation</label>
                        </div>
                        <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                            <input
                                type="checkbox"
                                id="am_cloture"
                                name="cloture"
                                checked={dp.cerfa?.amenagements?.cloture || false}
                                onChange={handleAmenagementChange}
                            />
                            <label htmlFor="am_cloture" style={{ margin: 0, fontWeight: 'normal' }}>Clôture</label>
                        </div>
                    </div>
                </div>

                {/* --- FISCALITE --- */}
                <div className="form-section">
                    <h3 className="form-section-title">Déclaration des surfaces (Fiscalité)</h3>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="fisc_ext">Surface taxable existante (m²)</label>
                            <input
                                type="number"
                                step="0.01"
                                id="fisc_ext"
                                name="surface_taxable_existante"
                                value={dp.cerfa?.fiscalite?.surface_taxable_existante || 0}
                                onChange={(e) => handleNestedChange(e, 'fiscalite')}
                                placeholder="ex: 95"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fisc_creee">Surface taxable créée (m²)</label>
                            <input
                                type="number"
                                step="0.01"
                                id="fisc_creee"
                                name="surface_taxable_creee"
                                value={dp.cerfa?.fiscalite?.surface_taxable_creee || 0}
                                onChange={(e) => handleNestedChange(e, 'fiscalite')}
                                placeholder="ex: 0"
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ maxWidth: '50%' }}>
                        <label htmlFor="fisc_stat">Places de stationnement créées</label>
                        <input
                            type="number"
                            id="fisc_stat"
                            name="stationnement_cree"
                            value={dp.cerfa?.fiscalite?.stationnement_cree || 0}
                            onChange={(e) => handleNestedChange(e, 'fiscalite')}
                            placeholder="ex: 0"
                        />
                    </div>
                </div>

                {/* --- ARCHITECTE --- */}
                <div className="form-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 className="form-section-title" style={{ margin: 0 }}>Architecte</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="arch_recours"
                                name="recours"
                                checked={dp.cerfa?.architecte?.recours || false}
                                onChange={(e) => handleNestedChange(e, 'architecte')}
                            />
                            <label htmlFor="arch_recours" style={{ margin: 0, fontWeight: 'normal' }}>Recours à un architecte</label>
                        </div>
                    </div>

                    {dp.cerfa?.architecte?.recours && (
                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="arch_nom">Nom de l'architecte</label>
                                <input
                                    type="text"
                                    id="arch_nom"
                                    name="nom"
                                    value={dp.cerfa?.architecte?.nom || ""}
                                    onChange={(e) => handleNestedChange(e, 'architecte')}
                                    required={dp.cerfa?.architecte?.recours}
                                    placeholder="ex: Dupont"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="arch_num">N° d'inscription au tableau</label>
                                <input
                                    type="text"
                                    id="arch_num"
                                    name="numero"
                                    value={dp.cerfa?.architecte?.numero || ""}
                                    onChange={(e) => handleNestedChange(e, 'architecte')}
                                    required={dp.cerfa?.architecte?.recours}
                                    placeholder="ex: 123456"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SIGNATURE (Original) --- */}
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
                                onChange={handleCerfaChange}
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
                                        cerfa: { ...(prev.cerfa as any), date_signature: formatted }
                                    }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- PERSONNE MORALE (Original) --- */}
                <div className="form-section">
                    <h3 className="form-section-title">Informations Personne Morale (Optionnel)</h3>
                    <p className="form-description" style={{ marginBottom: "15px" }}>À remplir uniquement si le demandeur principal est une société.</p>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="denomination_sociale">Dénomination Sociale</label>
                            <input
                                type="text"
                                id="denomination_sociale"
                                name="denomination_sociale"
                                value={dp.cerfa?.denomination_sociale || ""}
                                onChange={handleCerfaChange}
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
                                onChange={handleCerfaChange}
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
                            onChange={handleCerfaChange}
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
