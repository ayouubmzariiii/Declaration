import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { DeclarationPrealable } from "@/lib/models";

// Define the 4 themes
const THEMES: Record<string, { primary: [number, number, number], secondary: [number, number, number], text_title: [number, number, number], text_body: [number, number, number], border: [number, number, number] }> = {
    classique: {
        primary: [0 / 255, 0 / 255, 145 / 255],     // Bleu France
        secondary: [225 / 255, 0 / 255, 15 / 255],  // Rouge Marianne
        text_title: [30 / 255, 30 / 255, 30 / 255],
        text_body: [58 / 255, 58 / 255, 58 / 255],
        border: [204 / 255, 204 / 255, 204 / 255]
    },
    moderne: {
        primary: [34 / 255, 40 / 255, 49 / 255],
        secondary: [0 / 255, 173 / 255, 181 / 255],
        text_title: [34 / 255, 40 / 255, 49 / 255],
        text_body: [57 / 255, 62 / 255, 70 / 255],
        border: [238 / 255, 238 / 255, 238 / 255]
    },
    nature: {
        primary: [45 / 255, 106 / 255, 79 / 255],
        secondary: [216 / 255, 243 / 255, 220 / 255],
        text_title: [27 / 255, 67 / 255, 50 / 255],
        text_body: [64 / 255, 61 / 255, 57 / 255],
        border: [212 / 255, 212 / 255, 212 / 255]
    },
    architecte: {
        primary: [20 / 255, 33 / 255, 61 / 255],
        secondary: [252 / 255, 163 / 255, 17 / 255],
        text_title: [0 / 255, 0 / 255, 0 / 255],
        text_body: [51 / 255, 51 / 255, 51 / 255],
        border: [229 / 255, 229 / 255, 229 / 255]
    }
};

export async function POST(req: Request) {
    try {
        const { dp, theme }: { dp: DeclarationPrealable, theme: string } = await req.json();
        const activeTheme = THEMES[theme] || THEMES["classique"];

        // Initialize document
        const pdfDoc = await PDFDocument.create();
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const margin = 50;
        const pageWidth = 595.28; // A4 pt
        const pageHeight = 841.89; // A4 pt
        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        // Helper functions
        const drawText = (text: string, font: any, size: number, color: [number, number, number], x: number, lineSpacing: number = 0) => {
            // Very basic text wrapping
            const maxLineWidth = pageWidth - margin * 2;
            const words = (text || "—").split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const textWidth = font.widthOfTextAtSize(testLine, size);
                if (textWidth > maxLineWidth && line !== '') {
                    page.drawText(line, { x, y, size, font, color: rgb(...color) });
                    y -= (size + lineSpacing);
                    // Check page break
                    if (y < margin) {
                        page = pdfDoc.addPage([pageWidth, pageHeight]);
                        y = pageHeight - margin;
                        drawHeader();
                    }
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            page.drawText(line, { x, y, size, font, color: rgb(...color) });
            y -= (size + lineSpacing);
        };

        const drawHeader = () => {
            // Theme banner
            page.drawRectangle({
                x: 0, y: pageHeight - 15, width: pageWidth, height: 15,
                color: rgb(...activeTheme.primary)
            });
            if (theme === "classique") {
                page.drawRectangle({
                    x: pageWidth / 3, y: pageHeight - 15, width: pageWidth / 3, height: 15,
                    color: rgb(1, 1, 1)
                });
                page.drawRectangle({
                    x: (pageWidth / 3) * 2, y: pageHeight - 15, width: pageWidth / 3, height: 15,
                    color: rgb(...activeTheme.secondary)
                });
            }
            page.drawText("CERFA n° 13703*09", { x: margin, y: pageHeight - 40, size: 10, font: fontRegular, color: rgb(...activeTheme.primary) });
            page.drawText(`Date: ${dp.date_creation}`, { x: pageWidth - margin - 80, y: pageHeight - 40, size: 10, font: fontRegular, color: rgb(...activeTheme.text_body) });
            y = pageHeight - 80;
        };

        const drawSectionHeader = (title: string) => {
            if (y < margin + 100) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            y -= 20;
            page.drawRectangle({
                x: margin, y: y - 5, width: pageWidth - margin * 2, height: 25,
                color: rgb(...activeTheme.primary)
            });
            page.drawText(title, { x: margin + 10, y: y + 2, size: 14, font: fontBold, color: rgb(1, 1, 1) });
            y -= 25;
        };

        const drawField = (label: string, value: string) => {
            if (y < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            page.drawText(label, { x: margin, y, size: 10, font: fontRegular, color: rgb(...activeTheme.text_body) });
            drawText(value, fontBold, 10, activeTheme.text_title, margin + 150, 15);
        };

        // --- PAGE 1 : Couverture & Informations ---
        drawHeader();

        // Titre
        const titleText = "Déclaration Préalable de Travaux";
        const titleWidth = fontBold.widthOfTextAtSize(titleText, 22);
        page.drawText(titleText, { x: (pageWidth - titleWidth) / 2, y, size: 22, font: fontBold, color: rgb(...activeTheme.primary) });
        y -= 30;

        const refText = `Référence du dossier : ${dp.reference}`;
        const refWidth = fontRegular.widthOfTextAtSize(refText, 12);
        page.drawText(refText, { x: (pageWidth - refWidth) / 2, y, size: 12, font: fontRegular, color: rgb(...activeTheme.text_body) });
        y -= 40;

        // 1. Demandeur
        drawSectionHeader("1 - IDENTITÉ DU DEMANDEUR");
        drawField("Civilité / Nom :", `${dp.demandeur.civilite} ${dp.demandeur.prenom} ${dp.demandeur.nom}`);
        drawField("Qualité :", dp.demandeur.qualite);
        drawField("Adresse :", dp.demandeur.adresse);
        drawField("Code postal / Ville :", `${dp.demandeur.code_postal} ${dp.demandeur.ville}`);
        drawField("Email :", dp.demandeur.email);
        drawField("Téléphone :", dp.demandeur.telephone);

        // 2. Terrain
        drawSectionHeader("2 - LOCALISATION DU TERRAIN");
        drawField("Adresse :", dp.terrain.adresse);
        drawField("Code postal / Ville :", `${dp.terrain.code_postal} ${dp.terrain.commune}`);
        drawField("Parcelle cadastrale :", `Section ${dp.terrain.section_cadastrale} N° ${dp.terrain.numero_parcelle}`);
        drawField("Superficie totale :", `${dp.terrain.superficie_terrain} m²`);
        drawField("Règlement (Zone) :", dp.terrain.zone_plu);
        drawField("Spécificités :", `${dp.terrain.est_lotissement ? 'En lotissement. ' : ''}${dp.terrain.est_zone_protegee ? 'En secteur protégé.' : ''}`.trim() || 'Aucune');

        // 3. Travaux
        drawSectionHeader("3 - NATURE DES TRAVAUX");
        drawField("Type de travaux :", dp.travaux.type_travaux);
        drawField("Description courte :", dp.travaux.description_courte);
        drawField("Surface existante :", `${dp.travaux.surface_plancher_existante} m² (Plancher) / ${dp.travaux.emprise_au_sol_existante} m² (Emprise)`);
        drawField("Surface modifiée :", `Créée : ${dp.travaux.surface_plancher_creee} m² (Plancher) / ${dp.travaux.emprise_au_sol_creee} m² (Emprise)`);
        drawField("Hauteur bâtiment :", `Existante : ${dp.travaux.hauteur_existante} m / Projetée : ${dp.travaux.hauteur_projetee} m`);

        // --- PAGE 2 : Aspect Extérieur & Notice ---
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();

        drawSectionHeader("4 - ASPECT EXTÉRIEUR DES CONSTRUCTIONS");

        page.drawText("Ouvertures et Menuiseries", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("Nombre existant :", dp.aspect_exterieur.nombre_ouvertures_existantes);
        drawField("Nombre projeté :", dp.aspect_exterieur.nombre_ouvertures_projetees);
        drawField("Types existants :", dp.aspect_exterieur.menuiseries_existantes);
        drawField("Types projetés :", dp.aspect_exterieur.menuiseries_projetees);

        page.drawText("Façades et Toitures", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("Façade existante :", dp.aspect_exterieur.facade_materiaux_existants);
        drawField("Façade projetée :", dp.aspect_exterieur.facade_materiaux_projetes);
        drawField("Toiture existante :", dp.aspect_exterieur.toiture_materiaux_existants);
        drawField("Toiture projetée :", dp.aspect_exterieur.toiture_materiaux_projetes);

        page.drawText("Palette de couleurs", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("Couleur Façade :", dp.aspect_exterieur.couleur_facade);
        drawField("Couleur Menuiseries :", dp.aspect_exterieur.couleur_menuiseries);
        drawField("Couleur Toiture :", dp.aspect_exterieur.couleur_toiture);

        drawSectionHeader("5 - NOTICE DESCRIPTIVE DU PROJET (DP11)");

        const drawParagraph = (title: string, content: string) => {
            if (y < margin + 40) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            page.drawText(title, { x: margin, y, size: 11, font: fontBold, color: rgb(...activeTheme.text_title) });
            y -= 15;
            drawText(content, fontRegular, 10, activeTheme.text_body, margin, 15);
            y -= 10;
        };

        drawParagraph("5.1 - État initial du terrain et de la construction", dp.notice.etat_initial);
        drawParagraph("5.2 - Description du projet", dp.notice.etat_projete);
        drawParagraph("5.3 - Analyse technique estimée", dp.notice.modifications_detaillees);
        drawField("Surface plancher :", dp.notice.modification_surface_plancher);
        drawField("Emprise au sol :", dp.notice.modification_emprise_au_sol);
        drawField("Volume :", dp.notice.modification_volume);
        drawField("Hauteur existante :", dp.notice.hauteur_estimee_existante);
        drawField("Hauteur projetée :", dp.notice.hauteur_estimee_projete);

        y -= 10;
        drawParagraph("5.4 - Analyse réglementaire", "");
        drawParagraph(`Cohérence architecturale (Zone ${dp.terrain.zone_plu}) :`, dp.notice.coherence_architecturale);
        drawParagraph("Risques réglementaires potentiels :", dp.notice.risques_reglementaires_potentiels);
        drawParagraph(`Niveau de confiance IA :`, dp.notice.niveau_confiance_global);

        drawParagraph("5.5 - Justification du projet", dp.notice.justification);
        drawParagraph("5.6 - Insertion paysagère", dp.notice.insertion_paysagere);
        drawParagraph("5.7 - Impact environnemental", dp.notice.impact_environnemental);

        // --- PAGE 3+ : Photos ---
        if (dp.photo_sets && dp.photo_sets.length > 0) {
            for (const [idx, ps] of dp.photo_sets.entries()) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
                drawSectionHeader(`6 - REPORTAGE PHOTOGRAPHIQUE - ${ps.label.toUpperCase()}`);

                const drawImageStr = async (base64Str: string | null | undefined, title: string, startY: number) => {
                    if (!base64Str) return;
                    try {
                        const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
                        const imageBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
                        let img;
                        // Best effort to embed based on apparent format
                        if (base64Str.includes("image/png")) {
                            img = await pdfDoc.embedPng(imageBytes);
                        } else {
                            img = await pdfDoc.embedJpg(imageBytes);
                        }

                        const imgWidth = pageWidth - margin * 2;
                        const imgHeight = (img.height / img.width) * imgWidth;

                        page.drawText(title, { x: margin, y: startY, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
                        const rectY = startY - imgHeight - 10;

                        // Draw image with border
                        page.drawRectangle({
                            x: margin - 2, y: rectY - 2, width: imgWidth + 4, height: imgHeight + 4,
                            color: rgb(...activeTheme.border)
                        });
                        page.drawImage(img, { x: margin, y: rectY, width: imgWidth, height: imgHeight });

                        return rectY - 30; // Return next Y position
                    } catch (e) {
                        console.error("Error embedding image in PDF", e);
                        page.drawText(`[Erreur d'insertion de l'image: ${title}]`, { x: margin, y: startY - 20, size: 10, font: fontRegular, color: rgb(1, 0, 0) });
                        return startY - 40;
                    }
                };

                y -= 10;
                let nextY = await drawImageStr(ps.base64_avant, "ÉTAT EXISTANT (Avant)", y);
                if (nextY) {
                    await drawImageStr(ps.base64_apres, "ÉTAT PROJETÉ (Après)", nextY);
                }
            }
        }

        // Serialize PDF
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes as any, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${dp.reference}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
