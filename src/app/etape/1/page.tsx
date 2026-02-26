"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDP } from "@/context/DPContext";
import { Progress } from "@/components/Progress";

export default function Step1() {
    const router = useRouter();
    const { dp, updateDP } = useDP();
    const [mapPreview, setMapPreview] = useState<{ dp1_1: string, dp1_2: string, dp1_3: string, dp2: string } | null>(null);
    const [loadingMap, setLoadingMap] = useState(false);
    const [mapError, setMapError] = useState("");

    const fetchMapPreview = async () => {
        if (!dp.terrain.adresse || !dp.terrain.commune) {
            setMapError("Veuillez remplir l'adresse et la commune du terrain d'abord.");
            return;
        }

        setLoadingMap(true);
        setMapError("");
        setMapPreview(null);

        try {
            const res = await fetch(`/api/preview-maps?address=${encodeURIComponent(dp.terrain.adresse)}&city=${encodeURIComponent(dp.terrain.commune)}`);
            const data = await res.json();
            if (data.success) {
                setMapPreview(data.maps);
            } else {
                setMapError("Impossible de trouver cette adresse sur la carte.");
            }
        } catch (e) {
            setMapError("Erreur réseau lors du chargement de la carte.");
        } finally {
            setLoadingMap(false);
        }
    };

    const handleDemandeurChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateDP((prev) => ({
            ...prev,
            demandeur: { ...prev.demandeur, [name]: value },
        }));
    };

    const handleTerrainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        const finalValue = type === "checkbox" ? checked : value;
        updateDP((prev) => ({
            ...prev,
            terrain: { ...prev.terrain, [name]: finalValue },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/etape/2");
    };

    return (
        <div className="wizard-container">
            <Progress step={1} totalSteps={6} />

            <form onSubmit={handleSubmit} className="wizard-form">
                <div className="form-header">
                    <h2>👤 Identité et Localisation</h2>
                    <p className="form-description">
                        Ces éléments correspondent aux cadres 1 et 2 du formulaire CERFA. Ils sont nécessaires
                        pour identifier le déclarant et la parcelle concernée par les travaux.
                    </p>
                </div>

                {/* Section 1 : Demandeur */}
                <div className="form-section">
                    <h3 className="form-section-title">1. Identité du déclarant</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="civilite">Civilité</label>
                            <select name="civilite" id="civilite" value={dp.demandeur.civilite} onChange={handleDemandeurChange}>
                                <option value="M.">Monsieur</option>
                                <option value="Mme">Madame</option>
                                <option value="Société">Société / Personne morale</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="qualite">Qualité du signataire</label>
                            <select name="qualite" id="qualite" value={dp.demandeur.qualite} onChange={handleDemandeurChange}>
                                <option value="Propriétaire">Propriétaire du terrain</option>
                                <option value="Mandataire">Mandataire ou Architecte</option>
                                <option value="Syndic">Syndic de copropriété</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="nom">Nom</label>
                            <input type="text" name="nom" id="nom" required value={dp.demandeur.nom} onChange={handleDemandeurChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="prenom">Prénom</label>
                            <input type="text" name="prenom" id="prenom" required value={dp.demandeur.prenom} onChange={handleDemandeurChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email de contact</label>
                            <input type="email" name="email" id="email" required value={dp.demandeur.email} onChange={handleDemandeurChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="telephone">Téléphone</label>
                            <input type="tel" name="telephone" id="telephone" required value={dp.demandeur.telephone} onChange={handleDemandeurChange} />
                        </div>
                        <div className="form-group form-group-full">
                            <label htmlFor="adresse_demandeur">Adresse de correspondance</label>
                            <input type="text" name="adresse" id="adresse_demandeur" placeholder="N° et libellé de la voie" required value={dp.demandeur.adresse} onChange={handleDemandeurChange} />
                        </div>
                    </div>
                </div>

                {/* Section 2 : Terrain */}
                <div className="form-section">
                    <h3 className="form-section-title">2. Localisation du terrain</h3>

                    <div className="checkbox-group" style={{ marginBottom: "1.5rem" }}>
                        <label className="checkbox-label" style={{ fontWeight: 500, color: "var(--primary-color)", fontSize: "0.95rem" }}>
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        updateDP((prev) => ({
                                            ...prev,
                                            terrain: {
                                                ...prev.terrain,
                                                adresse: prev.demandeur.adresse,
                                                code_postal: prev.demandeur.code_postal,
                                                commune: prev.demandeur.ville
                                            }
                                        }));
                                    }
                                }}
                            />
                            Le terrain correspond à l'adresse du demandeur (copier l'adresse)
                        </label>
                    </div>

                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label htmlFor="adresse_terrain">Adresse du terrain</label>
                            <input type="text" name="adresse" id="adresse_terrain" required value={dp.terrain.adresse} onChange={handleTerrainChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="code_postal_terrain">Code postal</label>
                            <input type="text" name="code_postal" id="code_postal_terrain" required value={dp.terrain.code_postal} onChange={handleTerrainChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="commune_terrain">Commune</label>
                            <input type="text" name="commune" id="commune_terrain" required value={dp.terrain.commune} onChange={handleTerrainChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="section_cadastrale">Section cadastrale (ex: AB)</label>
                            <input type="text" name="section_cadastrale" id="section_cadastrale" required value={dp.terrain.section_cadastrale} onChange={handleTerrainChange} />
                            <small className="help-text">Visible sur le relevé de propriété ou Geoportail</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="numero_parcelle">N° de parcelle (ex: 125)</label>
                            <input type="text" name="numero_parcelle" id="numero_parcelle" required value={dp.terrain.numero_parcelle} onChange={handleTerrainChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="superficie_terrain">Superficie totale du terrain (m²)</label>
                            <input type="number" step="0.1" name="superficie_terrain" id="superficie_terrain" required value={dp.terrain.superficie_terrain} onChange={handleTerrainChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zone_plu">Règlement local (Zone PLU)</label>
                            <input type="text" name="zone_plu" id="zone_plu" placeholder="ex: UB, UBa, N..." required value={dp.terrain.zone_plu} onChange={handleTerrainChange} />
                        </div>

                        <div className="form-group form-group-full">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="est_lotissement" checked={dp.terrain.est_lotissement} onChange={handleTerrainChange} />
                                    Le projet se situe dans un lotissement
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" name="est_zone_protegee" checked={dp.terrain.est_zone_protegee} onChange={handleTerrainChange} />
                                    Le projet se situe en secteur protégé (Architecte des Bâtiments de France)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="map-preview-section" style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: '10px' }}>🗺️ Aperçu des plans générés par Géoportail</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Ces cartes seront incluses automatiquement dans votre PDF final pour les pièces DP1, DP2 et DP3 en fonction de l'adresse renseignée ci-dessus.
                        </p>

                        <div className="form-group" style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                            <label style={{ fontWeight: 600 }}>Choix de l'affichage du DP1 (Plan de situation) :</label>
                            <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="dp1_mode"
                                        value="classique"
                                        checked={dp.terrain.dp1_mode === "classique"}
                                        onChange={handleTerrainChange}
                                    />
                                    <strong>Mode Classique :</strong> Une seule grande carte (conforme au standard classique)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="dp1_mode"
                                        value="detaille"
                                        checked={dp.terrain.dp1_mode === "detaille"}
                                        onChange={handleTerrainChange}
                                    />
                                    <strong>Mode Détaillé (4 vues) :</strong> Inclut le cadastre, une vue satellite proche et la photo sur rue
                                </label>
                            </div>
                        </div>

                        <button type="button" className="btn btn-secondary" onClick={fetchMapPreview} disabled={loadingMap} style={{ marginBottom: '15px' }}>
                            {loadingMap ? "Chargement..." : "Vérifier la localisation sur la carte"}
                        </button>

                        {mapError && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{mapError}</div>}

                        {mapPreview && dp.terrain.dp1_mode === "detaille" && (
                            <div className="map-images-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP1 - Plan de situation (Ville)</strong>
                                    <img src={mapPreview.dp1_1} alt="DP1 Ville" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP1 - Plan Cadastral</strong>
                                    <div style={{ position: 'relative' }}>
                                        <img src={mapPreview.dp1_2} alt="DP1 Cadastre" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', border: '2px solid red', borderRadius: '50%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP1 - Plan de situation (Proximité)</strong>
                                    <div style={{ position: 'relative' }}>
                                        <img src={mapPreview.dp1_3} alt="DP1 Satellite" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', border: '2px solid red', borderRadius: '50%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP2 - Plan de masse (Orthophoto)</strong>
                                    <div style={{ position: 'relative' }}>
                                        <img src={mapPreview.dp2} alt="DP2 Plan" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', border: '2px solid red', borderRadius: '50%' }}></div>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', backgroundColor: 'red', borderRadius: '50%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mapPreview && dp.terrain.dp1_mode === "classique" && (
                            <div className="map-images-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP1 - Plan de situation</strong>
                                    <img src={mapPreview.dp1_1} alt="DP1 Plan" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DP2 - Plan de masse</strong>
                                    <div style={{ position: 'relative' }}>
                                        <img src={mapPreview.dp2} alt="DP2 Plan" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', border: '2px solid red', borderRadius: '50%' }}></div>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', backgroundColor: 'red', borderRadius: '50%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <a href="/" className="btn btn-secondary">← Retour</a>
                    <button type="submit" className="btn btn-primary">Suivant →</button>
                </div>
            </form>
        </div>
    );
}
