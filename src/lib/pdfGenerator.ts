import { PDFDocument } from 'pdf-lib';
import { DeclarationPrealable } from './models';
import fs from 'fs';
import path from 'path';

export async function generateCerfaPDF(dp: DeclarationPrealable): Promise<Uint8Array> {
    // Load the cerfa.pdf file
    const cerfaPath = path.join(process.cwd(), 'cerfa.pdf');
    const pdfBytes = fs.readFileSync(cerfaPath);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Safely set text field
    const setTextField = (fieldName: string, value: string | undefined | null) => {
        if (value) {
            try {
                const field = form.getTextField(fieldName);
                field.setText(value);
            } catch (e) {
                console.warn(`Could not set text field: ${fieldName}`);
            }
        }
    };

    // Safely set checkbox
    const checkField = (fieldName: string, condition: boolean) => {
        if (condition) {
            try {
                const field = form.getCheckBox(fieldName);
                field.check();
            } catch (e) {
                console.warn(`Could not check checkbox field: ${fieldName}`);
            }
        }
    };

    // Map Demandeur
    if (dp.demandeur) {
        setTextField('D1N_nom', dp.demandeur.nom);
        setTextField('D1P_prenom', dp.demandeur.prenom);
        checkField('D1H_homme', dp.demandeur.civilite === 'M.');
        checkField('D1F_femme', dp.demandeur.civilite === 'Mme' || dp.demandeur.civilite === 'Mlle');
        setTextField('D1A_naissance', dp.demandeur.date_naissance);
        setTextField('D1C_commune', dp.demandeur.lieu_naissance);
        setTextField('D3V_voie', dp.demandeur.adresse);
        setTextField('D3C_code', dp.demandeur.code_postal);
        setTextField('D3L_localite', dp.demandeur.ville);
        setTextField('D3T_telephone', dp.demandeur.telephone);
        setTextField('D5GE1_email', dp.demandeur.email);
    }

    // Map Terrain
    if (dp.terrain) {
        setTextField('T2V_voie', dp.terrain.adresse);
        setTextField('T2C_code', dp.terrain.code_postal);
        setTextField('T2L_localite', dp.terrain.commune);
        setTextField('T2S_section', dp.terrain.section_cadastrale);
        setTextField('T2N_numero', dp.terrain.numero_parcelle);
        if (dp.terrain.superficie_terrain !== undefined) {
            setTextField('T2T_superficie', dp.terrain.superficie_terrain.toString());
        }
        checkField('T2J_lotissement', dp.terrain.est_lotissement);
    }

    // Map Travaux
    if (dp.travaux) {
        setTextField('C2ZD1_description', dp.travaux.description_courte);
        if (dp.travaux.surface_plancher_existante !== undefined) {
            setTextField('C7A_surface', dp.travaux.surface_plancher_existante.toString());
        }
        if (dp.travaux.surface_plancher_creee !== undefined) {
            setTextField('C7U_creee', dp.travaux.surface_plancher_creee.toString());
        }
    }

    // Form Date and Signature location (E1L_lieu, E1D_date)
    if (dp.cerfa) {
        setTextField('E1D_date', dp.cerfa.date_signature);
        setTextField('E1L_lieu', dp.cerfa.lieu_signature);
        setTextField('D2D_denomination', dp.cerfa.denomination_sociale);
        setTextField('D4MD1_denomination', dp.cerfa.denomination_sociale);
        setTextField('D2S_SIRET', dp.cerfa.siret);
        setTextField('D4MS1_siret', dp.cerfa.siret);
        setTextField('X1P_precisions', dp.cerfa.nature_precisions);

        // Co-demandeur
        if (dp.cerfa.co_demandeur) {
            setTextField('D4N_nom', dp.cerfa.co_demandeur.nom);
            setTextField('D4P_prenom', dp.cerfa.co_demandeur.prenom);
            setTextField('D4V_voie', dp.cerfa.co_demandeur.adresse);
            setTextField('D4C_code', dp.cerfa.co_demandeur.code_postal);
            setTextField('D4L_localite', dp.cerfa.co_demandeur.ville);
            setTextField('D4T_telephone', dp.cerfa.co_demandeur.telephone);
            setTextField('D4GE1_email', dp.cerfa.co_demandeur.email);
        }

        // Aménagements
        if (dp.cerfa.amenagements) {
            checkField('C5ZE1_piscine', dp.cerfa.amenagements.piscine);
            checkField('C5ZE2_garage', dp.cerfa.amenagements.garage);
            checkField('C5ZE3_veranda', dp.cerfa.amenagements.veranda);
            checkField('C5ZE4_abri', dp.cerfa.amenagements.abri);
            checkField('C5ZK1_extension', dp.cerfa.amenagements.extension);
            checkField('C5ZK2_surelevation', dp.cerfa.amenagements.surelevation);
            checkField('C2ZC3_cloture', dp.cerfa.amenagements.cloture);
        }

        // Fiscalité
        if (dp.cerfa.fiscalite) {
            setTextField('T5ZA1', dp.cerfa.fiscalite.surface_taxable_existante.toString());
            setTextField('T5ZB1', dp.cerfa.fiscalite.surface_taxable_creee.toString());
            setTextField('T5ZC1', dp.cerfa.fiscalite.stationnement_cree.toString());
        }

        // Architecte
        if (dp.cerfa.architecte && dp.cerfa.architecte.recours) {
            setTextField('R2N_deposant', dp.cerfa.architecte.nom);
            setTextField('R2A_numero', dp.cerfa.architecte.numero);
        }
    } else {
        setTextField('E1D_date', dp.date_creation || new Date().toLocaleDateString('fr-FR'));
    }

    // Set the "Acceptation" box
    checkField('D5A_acceptation', true);

    // Flatten the form to make it read-only
    form.flatten();

    return await pdfDoc.save();
}
