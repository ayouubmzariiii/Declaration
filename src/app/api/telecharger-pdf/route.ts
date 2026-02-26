import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { DeclarationPrealable } from "@/lib/models";

export async function POST(req: Request) {
    try {
        const { dp, orientation = "portrait" }: { dp: DeclarationPrealable, orientation?: string } = await req.json();

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

        const drawText = (text: string, font: any, size: number, color: [number, number, number], x: number, lineSpacing: number = 0, align: string = "left", maxWidth?: number) => {
            const maxLineWidth = maxWidth ? maxWidth : (pageWidth - margin - x);
            const words = (text || "—").split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const textWidth = font.widthOfTextAtSize(testLine, size);
                if (textWidth > maxLineWidth && line !== '') {
                    let drawX = x;
                    if (align === "center") {
                        const lw = font.widthOfTextAtSize(line.trim(), size);
                        drawX = (pageWidth - lw) / 2;
                    }
                    page.drawText(line.trim(), { x: drawX, y, size, font, color: rgb(...color) });
                    y -= (size + lineSpacing);

                    if (y < margin + 20) {
                        page = pdfDoc.addPage([pageWidth, pageHeight]);
                        y = pageHeight - margin;
                        drawHeader();
                    }
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim() !== '') {
                let drawX = x;
                if (align === "center") {
                    const lw = font.widthOfTextAtSize(line.trim(), size);
                    drawX = (pageWidth - lw) / 2;
                }
                page.drawText(line.trim(), { x: drawX, y, size, font, color: rgb(...color) });
                y -= (size + lineSpacing);
            }
        };

        const drawHeader = () => {
            page.drawText("RÉPUBLIQUE FRANÇAISE", { x: margin, y: pageHeight - margin, size: 10, font: fontBold, color: rgb(0, 0, 0) });
            page.drawText("MINISTÈRE CHARGÉ DE L'URBANISME", { x: margin, y: pageHeight - margin - 12, size: 6, font: fontRegular, color: rgb(0, 0, 0) });

            page.drawText("CERFA 13703*09", { x: pageWidth - margin - 100, y: pageHeight - margin, size: 10, font: fontBold, color: rgb(0, 0, 0) });
            const dateStr = dp.date_creation ? dp.date_creation : new Date().toLocaleDateString('fr-FR');
            page.drawText(`Date : ${dateStr}`, { x: pageWidth - margin - 100, y: pageHeight - margin - 12, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

            page.drawRectangle({
                x: margin, y: pageHeight - margin - 22, width: pageWidth - margin * 2, height: 1, color: rgb(0, 0, 0)
            });
            y = pageHeight - margin - 50;
        };

        const drawSectionHeader = (title: string, subtitle?: string) => {
            if (y < margin + 60) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            y -= 10;
            page.drawRectangle({
                x: margin, y: y - 5, width: pageWidth - margin * 2, height: 25,
                color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0, 0, 0), borderWidth: 1
            });
            page.drawText(title, { x: margin + 10, y: y + 2, size: 10, font: fontBold, color: rgb(0, 0, 0) });
            y -= 25;
            if (subtitle) {
                y -= 5;
                drawText(subtitle, fontRegular, 9, [0, 0, 0], margin, 5);
                y -= 5;
            }
        };

        const drawField = (label: string, value: string) => {
            if (y < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            page.drawText(label, { x: margin, y, size: 9, font: fontBold, color: rgb(0, 0, 0) });
            drawText(value, fontRegular, 9, [0, 0, 0], margin + 150, 15);
        };

        const drawParagraph = (title: string, content: string) => {
            if (y < margin + 50) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }
            page.drawText(title, { x: margin, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
            y -= 15;
            drawText(content || "Non renseigné", fontRegular, 9, [0.1, 0.1, 0.1], margin + 5, 12);
            y -= 10;
        };

        const drawPlaceholderBox = (title: string, desc: string, height: number = 300) => {
            if (y < margin + height + 50) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }

            page.drawText(title, { x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
            y -= 15;
            page.drawText(desc, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
            y -= 15;

            page.drawRectangle({
                x: margin, y: y - height, width: pageWidth - margin * 2, height: height,
                borderColor: rgb(0, 0, 0), borderWidth: 1, borderDashArray: [5, 5]
            });
            const textWidth = fontBold.widthOfTextAtSize("PIÈCE À JOINDRE DANS CE CADRE", 12);
            page.drawText("PIÈCE À JOINDRE DANS CE CADRE", { x: (pageWidth - textWidth) / 2, y: y - height / 2, size: 12, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

            y -= height + 30;
        };

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

        // --- PAGE 1: Intro ---
        drawHeader();

        const titleText = "DÉCLARATION PRÉALABLE";
        drawText(titleText, fontBold, 16, [0, 0, 0], 0, 10, "center");
        y -= 5;
        const subtitleText = "Constructions, travaux, installations et aménagements non soumis à permis de construire";
        drawText(subtitleText, fontRegular, 9, [0, 0, 0], 0, 20, "center");
        y -= 10;

        drawSectionHeader("1. IDENTITÉ DU DEMANDEUR");
        drawField("Civilité / Nom :", `${dp.demandeur?.civilite || ''} ${dp.demandeur?.prenom || ''} ${dp.demandeur?.nom || ''}`);
        drawField("Qualité :", dp.demandeur?.qualite || '');
        drawField("Adresse :", dp.demandeur?.adresse || '');
        drawField("Code postal / Ville :", `${dp.demandeur?.code_postal || ''} ${dp.demandeur?.ville || ''}`);
        drawField("Email :", dp.demandeur?.email || '');
        drawField("Téléphone :", dp.demandeur?.telephone || '');

        drawSectionHeader("2. LOCALISATION DU TERRAIN");
        drawField("Adresse :", dp.terrain?.adresse || '');
        drawField("Code postal / Ville :", `${dp.terrain?.code_postal || ''} ${dp.terrain?.commune || ''}`);
        drawField("Parcelle cadastrale :", `Section ${dp.terrain?.section_cadastrale || ''} N° ${dp.terrain?.numero_parcelle || ''}`);
        drawField("Superficie totale :", `${dp.terrain?.superficie_terrain || ''} m²`);

        drawSectionHeader("3. NATURE DES TRAVAUX");
        drawField("Type de travaux :", dp.travaux?.type_travaux || '');
        drawField("Description courte :", dp.travaux?.description_courte || '');

        // --- PIÈCES OBLIGATOIRES ---

        // DP2 Plan de masse
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        drawPlaceholderBox("DP2 – Plan de masse", "Vue aérienne du terrain avec implantation des bâtiments existants, du projet, distances aux limites et accès.", 500);

        // DP3 Plan en coupe
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        drawPlaceholderBox("DP3 – Plan en coupe", "Obligatoire si modification du relief, création d'une terrasse surélevée, ou construction modifiant le profil du terrain.", 500);

        // DP4 Notice descriptive
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        page.drawText("DP4 – Notice descriptive", { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0, 0) });
        y -= 25;
        drawText("Explique : le projet, les matériaux, les couleurs, et l'intégration dans l'environnement.", fontRegular, 10, [0.3, 0.3, 0.3], margin, 15);
        y -= 10;

        drawParagraph("État initial du terrain et de la construction", dp.notice?.etat_initial || "Non spécifié");
        drawParagraph("Description du projet", dp.notice?.etat_projete || "Non spécifié");
        drawParagraph("Analyse technique", dp.notice?.modifications_detaillees || "Non spécifié");
        drawParagraph("Justification du projet", dp.notice?.justification || "Non spécifié");
        drawParagraph("Insertion paysagère", dp.notice?.insertion_paysagere || "Non spécifié");
        drawParagraph("Impact environnemental", dp.notice?.impact_environnemental || "Non spécifié");

        drawSectionHeader("Détails des surfaces et hauteurs");
        drawField("Surface existante :", `${dp.travaux?.surface_plancher_existante || 0} m² (Plancher) / ${dp.travaux?.emprise_au_sol_existante || 0} m² (Emprise)`);
        drawField("Surface modifiée :", `Créée : ${dp.travaux?.surface_plancher_creee || 0} m² (Plancher) / ${dp.travaux?.emprise_au_sol_creee || 0} m² (Emprise)`);
        drawField("Hauteur bâtiment :", `Existante : ${dp.travaux?.hauteur_existante || 0} m / Projetée : ${dp.travaux?.hauteur_projetee || 0} m`);

        drawSectionHeader("Matériaux et Couleurs Projetés");
        drawField("Façades :", `${dp.aspect_exterieur?.facade_materiaux_projetes || ''} - ${dp.aspect_exterieur?.couleur_facade || ''}`);
        drawField("Toitures :", `${dp.aspect_exterieur?.toiture_materiaux_projetes || ''} - ${dp.aspect_exterieur?.couleur_toiture || ''}`);
        drawField("Menuiseries :", `${dp.aspect_exterieur?.menuiseries_projetees || ''} - ${dp.aspect_exterieur?.couleur_menuiseries || ''}`);

        // DP5 Plans des façades et toitures
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        drawPlaceholderBox("DP5 – Plans des façades et toitures", "Avant / Après travaux.", 500);

        // DP6 Document graphique d'insertion
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        drawPlaceholderBox("DP6 – Document graphique d'insertion", "Montage ou perspective montrant le projet dans son environnement.", 500);

        // DP7 & DP8 Photographies
        if (dp.photo_sets && dp.photo_sets.length > 0) {
            for (const [idx, ps] of dp.photo_sets.entries()) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();

                page.drawText("DP7 et DP8 – Photographies", { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0, 0) });
                y -= 25;
                page.drawText(`Photographie : ${ps.label.toUpperCase()} (Vue proche : DP7 / Vue lointaine : DP8)`, { x: margin, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
                y -= 30;

                const drawImagePair = async (ps: any, startY: number) => {
                    try {
                        const imgAvant = ps.base64_avant ? await loadImg(ps.base64_avant) : null;
                        const imgApres = ps.base64_apres ? await loadImg(ps.base64_apres) : null;

                        if (!imgAvant && !imgApres) return startY;

                        const availableWidth = pageWidth - margin * 2;
                        const spacing = 15;
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

                            page.drawText("ÉTAT EXISTANT (Avant)", { x: margin, y: startY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
                            const rectYAvant = startY - imgHeightAvant - 10;
                            page.drawRectangle({ x: imgXAvant - 1, y: rectYAvant - 1, width: imgWidthAvant + 2, height: imgHeightAvant + 2, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                            page.drawImage(imgAvant, { x: imgXAvant, y: rectYAvant, width: imgWidthAvant, height: imgHeightAvant });

                            page.drawText("ÉTAT PROJETÉ (Après)", { x: margin + halfWidth + spacing, y: startY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
                            const rectYApres = startY - imgHeightApres - 10;
                            page.drawRectangle({ x: imgXApres - 1, y: rectYApres - 1, width: imgWidthApres + 2, height: imgHeightApres + 2, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                            page.drawImage(imgApres, { x: imgXApres, y: rectYApres, width: imgWidthApres, height: imgHeightApres });

                            let finalYAvant = rectYAvant - 15;
                            let finalYApres = rectYApres - 15;

                            if (ps.description_avant) {
                                y = finalYAvant;
                                drawText(ps.description_avant, fontRegular, 8, [0, 0, 0], margin, 10, "left", halfWidth);
                                finalYAvant = y;
                            }
                            if (ps.description_apres) {
                                y = rectYApres - 15;
                                drawText(ps.description_apres, fontRegular, 8, [0, 0, 0], margin + halfWidth + spacing, 10, "left", halfWidth);
                                finalYApres = y;
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

                            page.drawText(title, { x: margin, y: startY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
                            const rectY = startY - imgHeight - 10;

                            page.drawRectangle({ x: imgX - 1, y: rectY - 1, width: imgWidth + 2, height: imgHeight + 2, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                            page.drawImage(img!, { x: imgX, y: rectY, width: imgWidth, height: imgHeight });

                            y = rectY - 15;
                            const desc = imgAvant ? ps.description_avant : ps.description_apres;
                            if (desc) {
                                drawText(desc, fontRegular, 9, [0, 0, 0], margin, 12);
                            }

                            maxRectY = y;
                        }

                        return maxRectY - 10;

                    } catch (e) {
                        console.error("Error embedding images in PDF", e);
                        page.drawText("[Erreur d'insertion des images]", { x: margin, y: startY - 20, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
                        return startY - 40;
                    }
                };

                y -= 10;
                y = await drawImagePair(ps, y);
            }
        }

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes as any, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${dp.reference || 'dossier'}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
