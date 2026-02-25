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
        const { dp, theme, orientation = "portrait" }: { dp: DeclarationPrealable, theme: string, orientation?: string } = await req.json();
        const activeTheme = THEMES[theme] || THEMES["classique"];

        // Initialize document
        const pdfDoc = await PDFDocument.create();
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const margin = 50;
        let pageWidth = 595.28; // A4 pt
        let pageHeight = 841.89; // A4 pt

        if (orientation === "landscape") {
            pageWidth = 841.89;
            pageHeight = 595.28;
        }

        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        // Helper functions
        const drawText = (text: string, font: any, size: number, color: [number, number, number], x: number, lineSpacing: number = 0) => {
            // Very basic text wrapping
            const maxLineWidth = pageWidth - margin - x;
            const words = (text || "â€”").split(' ');
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
            page.drawText("CERFA nÂ° 13703*09", { x: margin, y: pageHeight - 40, size: 10, font: fontRegular, color: rgb(...activeTheme.primary) });
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
        const titleText = "DÃ©claration PrÃ©alable de Travaux";
        const titleWidth = fontBold.widthOfTextAtSize(titleText, 22);
        page.drawText(titleText, { x: (pageWidth - titleWidth) / 2, y, size: 22, font: fontBold, color: rgb(...activeTheme.primary) });
        y -= 30;

        const refText = `RÃ©fÃ©rence du dossier : ${dp.reference}`;
        const refWidth = fontRegular.widthOfTextAtSize(refText, 12);
        page.drawText(refText, { x: (pageWidth - refWidth) / 2, y, size: 12, font: fontRegular, color: rgb(...activeTheme.text_body) });
        y -= 40;

        // 1. Demandeur
        drawSectionHeader("1 - IDENTITÃ‰ DU DEMANDEUR");
        drawField("CivilitÃ© / Nom :", `${dp.demandeur.civilite} ${dp.demandeur.prenom} ${dp.demandeur.nom}`);
        drawField("QualitÃ© :", dp.demandeur.qualite);
        drawField("Adresse :", dp.demandeur.adresse);
        drawField("Code postal / Ville :", `${dp.demandeur.code_postal} ${dp.demandeur.ville}`);
        drawField("Email :", dp.demandeur.email);
        drawField("TÃ©lÃ©phone :", dp.demandeur.telephone);

        // 2. Terrain
        drawSectionHeader("2 - LOCALISATION DU TERRAIN");
        drawField("Adresse :", dp.terrain.adresse);
        drawField("Code postal / Ville :", `${dp.terrain.code_postal} ${dp.terrain.commune}`);
        drawField("Parcelle cadastrale :", `Section ${dp.terrain.section_cadastrale} NÂ° ${dp.terrain.numero_parcelle}`);
        drawField("Superficie totale :", `${dp.terrain.superficie_terrain} mÂ²`);
        drawField("RÃ¨glement (Zone) :", dp.terrain.zone_plu);
        drawField("SpÃ©cificitÃ©s :", `${dp.terrain.est_lotissement ? 'En lotissement. ' : ''}${dp.terrain.est_zone_protegee ? 'En secteur protÃ©gÃ©.' : ''}`.trim() || 'Aucune');

        // 3. Travaux
        drawSectionHeader("3 - NATURE DES TRAVAUX");
        drawField("Type de travaux :", dp.travaux.type_travaux);
        drawField("Description courte :", dp.travaux.description_courte);
        drawField("Surface existante :", `${dp.travaux.surface_plancher_existante} mÂ² (Plancher) / ${dp.travaux.emprise_au_sol_existante} mÂ² (Emprise)`);
        drawField("Surface modifiÃ©e :", `CrÃ©Ã©e : ${dp.travaux.surface_plancher_creee} mÂ² (Plancher) / ${dp.travaux.emprise_au_sol_creee} mÂ² (Emprise)`);
        drawField("Hauteur bÃ¢timent :", `Existante : ${dp.travaux.hauteur_existante} m / ProjetÃ©e : ${dp.travaux.hauteur_projetee} m`);

        // --- PAGE 2 : Aspect ExtÃ©rieur & Notice ---
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();

        drawSectionHeader("4 - ASPECT EXTÃ‰RIEUR DES CONSTRUCTIONS");

        page.drawText("Ouvertures et Menuiseries", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("Nombre existant :", dp.aspect_exterieur.nombre_ouvertures_existantes);
        drawField("Nombre projetÃ© :", dp.aspect_exterieur.nombre_ouvertures_projetees);
        drawField("Types existants :", dp.aspect_exterieur.menuiseries_existantes);
        drawField("Types projetÃ©s :", dp.aspect_exterieur.menuiseries_projetees);

        page.drawText("FaÃ§ades et Toitures", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("FaÃ§ade existante :", dp.aspect_exterieur.facade_materiaux_existants);
        drawField("FaÃ§ade projetÃ©e :", dp.aspect_exterieur.facade_materiaux_projetes);
        drawField("Toiture existante :", dp.aspect_exterieur.toiture_materiaux_existants);
        drawField("Toiture projetÃ©e :", dp.aspect_exterieur.toiture_materiaux_projetes);

        page.drawText("Palette de couleurs", { x: margin, y, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
        y -= 20;
        drawField("Couleur FaÃ§ade :", dp.aspect_exterieur.couleur_facade);
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

        drawParagraph("5.1 - Ã‰tat initial du terrain et de la construction", dp.notice.etat_initial);
        drawParagraph("5.2 - Description du projet", dp.notice.etat_projete);
        drawParagraph("5.3 - Analyse technique estimÃ©e", dp.notice.modifications_detaillees);
        drawField("Surface plancher :", dp.notice.modification_surface_plancher);
        drawField("Emprise au sol :", dp.notice.modification_emprise_au_sol);
        drawField("Volume :", dp.notice.modification_volume);
        drawField("Hauteur existante :", dp.notice.hauteur_estimee_existante);
        drawField("Hauteur projetÃ©e :", dp.notice.hauteur_estimee_projete);

        y -= 10;
        drawParagraph("5.4 - Analyse rÃ©glementaire", "");
        drawParagraph(`CohÃ©rence architecturale (Zone ${dp.terrain.zone_plu}) :`, dp.notice.coherence_architecturale);
        drawParagraph("Risques rÃ©glementaires potentiels :", dp.notice.risques_reglementaires_potentiels);
        drawParagraph(`Niveau de confiance IA :`, dp.notice.niveau_confiance_global);

        drawParagraph("5.5 - Justification du projet", dp.notice.justification);
        drawParagraph("5.6 - Insertion paysagÃ¨re", dp.notice.insertion_paysagere);
        drawParagraph("5.7 - Impact environnemental", dp.notice.impact_environnemental);

        // --- PAGE 3+ : Photos ---
        if (dp.photo_sets && dp.photo_sets.length > 0) {
            for (const [idx, ps] of dp.photo_sets.entries()) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
                drawSectionHeader(`6 - REPORTAGE PHOTOGRAPHIQUE - ${ps.label.toUpperCase()}`);

                const loadImg = async (base64Str: string) => {
                    let cleanBase64 = "";
                    let isPng = false;

                    if (base64Str.startsWith("/images/")) {
                        const fs = require('fs');
                        const path = require('path');
                        const filePath = path.join(process.cwd(), "public", base64Str);
                        const fileBuffer = fs.readFileSync(filePath);
                        cleanBase64 = fileBuffer.toString("base64");
                        isPng = base64Str.endsWith(".png");
                    } else {
                        cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
                        isPng = base64Str.includes("image/png");
                    }

                    const imageBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
                    if (isPng) return await pdfDoc.embedPng(imageBytes);
                    return await pdfDoc.embedJpg(imageBytes);
                };

                const drawTextWrapped = (text: string, font: any, size: number, color: any, x: number, y: number, maxWidth: number) => {
                    const words = text.split(' ');
                    let currentLine = '';
                    let currentY = y;
                    for (const word of words) {
                        const testLine = currentLine + word + ' ';
                        const metrics = font.widthOfTextAtSize(testLine, size);
                        if (metrics > maxWidth && currentLine !== '') {
                            page.drawText(currentLine, { x, y: currentY, size, font, color: rgb(...color) });
                            currentLine = word + ' ';
                            currentY -= (size + 4);
                        } else {
                            currentLine = testLine;
                        }
                    }
                    if (currentLine !== '') {
                        page.drawText(currentLine, { x, y: currentY, size, font, color: rgb(...color) });
                        currentY -= (size + 4);
                    }
                    return currentY;
                };

                const drawImagePair = async (ps: any, startY: number) => {
                    try {
                        const imgAvant = ps.base64_avant ? await loadImg(ps.base64_avant) : null;
                        const imgApres = ps.base64_apres ? await loadImg(ps.base64_apres) : null;

                        if (!imgAvant && !imgApres) return startY;

                        // Check if we need a new page for the image
                        if (startY < margin + 180) {
                            page = pdfDoc.addPage([pageWidth, pageHeight]);
                            drawHeader();
                            startY = y - 20;
                        }

                        const availableWidth = pageWidth - margin * 2;
                        const spacing = 20;
                        let maxRectY = startY;

                        if (imgAvant && imgApres) {
                            const halfWidth = (availableWidth - spacing) / 2;
                            let imgWidthAvant = halfWidth;
                            let imgHeightAvant = (imgAvant.height / imgAvant.width) * imgWidthAvant;
                            let imgWidthApres = halfWidth;
                            let imgHeightApres = (imgApres.height / imgApres.width) * imgWidthApres;
                            
                            const maxImgHeight = startY - margin - 80;
                            if (imgHeightAvant > maxImgHeight) {
                                imgHeightAvant = maxImgHeight;
                                imgWidthAvant = (imgAvant.width / imgAvant.height) * imgHeightAvant;
                            }
                            if (imgHeightApres > maxImgHeight) {
                                imgHeightApres = maxImgHeight;
                                imgWidthApres = (imgApres.width / imgApres.height) * imgHeightApres;
                            }

                            const imgXAvant = margin + (halfWidth - imgWidthAvant) / 2;
                            const imgXApres = margin + halfWidth + spacing + (halfWidth - imgWidthApres) / 2;
                            
                            page.drawText("ÉTAT EXISTANT (Avant)", { x: margin, y: startY, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
                            const rectYAvant = startY - imgHeightAvant - 10;
                            page.drawRectangle({ x: imgXAvant - 2, y: rectYAvant - 2, width: imgWidthAvant + 4, height: imgHeightAvant + 4, color: rgb(...activeTheme.border) });
                            page.drawImage(imgAvant, { x: imgXAvant, y: rectYAvant, width: imgWidthAvant, height: imgHeightAvant });

                            page.drawText("ÉTAT PROJETÉ (Après)", { x: margin + halfWidth + spacing, y: startY, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
                            const rectYApres = startY - imgHeightApres - 10;
                            page.drawRectangle({ x: imgXApres - 2, y: rectYApres - 2, width: imgWidthApres + 4, height: imgHeightApres + 4, color: rgb(...activeTheme.border) });
                            page.drawImage(imgApres, { x: imgXApres, y: rectYApres, width: imgWidthApres, height: imgHeightApres });

                            // Draw descriptions if they exist underneath
                            let finalYAvant = rectYAvant - 20;
                            let finalYApres = rectYApres - 20;
                            
                            if (ps.description_avant) {
                                finalYAvant = drawTextWrapped(ps.description_avant, fontRegular, 9, activeTheme.text_body, margin, rectYAvant - 20, halfWidth);
                            }
                            if (ps.description_apres) {
                                finalYApres = drawTextWrapped(ps.description_apres, fontRegular, 9, activeTheme.text_body, margin + halfWidth + spacing, rectYApres - 20, halfWidth);
                            }

                            maxRectY = Math.min(finalYAvant, finalYApres);
                        } else {
                            const img = imgAvant || imgApres;
                            const title = imgAvant ? "ÉTAT EXISTANT (Avant)" : "ÉTAT PROJETÉ (Après)";

                            let imgWidth = availableWidth;
                            let imgHeight = (img!.height / img!.width) * imgWidth;
                            
                            const maxImgHeight = startY - margin - 80;
                            if (imgHeight > maxImgHeight) {
                                imgHeight = maxImgHeight;
                                imgWidth = (img!.width / img!.height) * imgHeight;
                            }

                            const imgX = margin + (availableWidth - imgWidth) / 2;

                            page.drawText(title, { x: margin, y: startY, size: 12, font: fontBold, color: rgb(...activeTheme.text_title) });
                            const rectY = startY - imgHeight - 10;

                            page.drawRectangle({ x: imgX - 2, y: rectY - 2, width: imgWidth + 4, height: imgHeight + 4, color: rgb(...activeTheme.border) });
                            page.drawImage(img!, { x: imgX, y: rectY, width: imgWidth, height: imgHeight });
                            
                            let finalY = rectY - 20;
                            const desc = imgAvant ? ps.description_avant : ps.description_apres;
                            if (desc) {
                                finalY = drawTextWrapped(desc, fontRegular, 9, activeTheme.text_body, margin, rectY - 20, availableWidth);
                            }

                            maxRectY = finalY;
                        }

                        return maxRectY - 10;

                    } catch (e) {
                        console.error("Error embedding images in PDF", e);
                        page.drawText("[Erreur d'insertion des images]", { x: margin, y: startY - 20, size: 10, font: fontRegular, color: rgb(1, 0, 0) });
                        return startY - 40;
                    }
                };

                y -= 10;
                y = await drawImagePair(ps, y);
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

