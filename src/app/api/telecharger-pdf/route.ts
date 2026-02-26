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

        // --- GEOLOCATION FOR MAPS ---
        const geocodeAddress = async (address: string, city: string) => {
            if (!address || !city) return null;
            try {
                const query = encodeURIComponent(`${address}, ${city}, France`);
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
                    headers: { "User-Agent": "DeclarationPrealableApp/1.0", "Accept-Language": "fr" }
                });
                const data = await res.json();
                if (data && data.length > 0) {
                    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                }
            } catch (e) {
                console.error("Geocoding error", e);
            }
            return null;
        };

        const getIgnMap = async (lat: number, lon: number, sizeMeters: number, type: 'plan' | 'satellite' | 'cadastre') => {
            try {
                const latDiff = (sizeMeters / 2) / 111320;
                const lonDiff = (sizeMeters / 2) / (111320 * Math.cos(lat * Math.PI / 180));

                const minLat = lat - latDiff;
                const maxLat = lat + latDiff;
                const minLon = lon - lonDiff;
                const maxLon = lon + lonDiff;

                const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
                let layer = 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2';
                let format = 'image/jpeg';
                if (type === 'satellite') layer = 'ORTHOIMAGERY.ORTHOPHOTOS';
                if (type === 'cadastre') {
                    layer = 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS';
                    format = 'image/png';
                }

                const url = `https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bbox}&CRS=EPSG:4326&WIDTH=600&HEIGHT=400&LAYERS=${layer}&STYLES=&FORMAT=${format}`;

                const res = await fetch(url);
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    return Buffer.from(arrayBuffer).toString('base64');
                }
            } catch (e) {
                console.error("IGN WMS error", e);
            }
            return null;
        };

        const drawIgnMapBox = async (title: string, desc: string, base64Jpg: string | null, height: number = 400) => {
            if (y < margin + height + 50) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }

            page.drawText(title, { x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
            y -= 15;
            page.drawText(desc, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
            y -= 15;

            const boxWidth = pageWidth - margin * 2;

            if (base64Jpg) {
                try {
                    const imageBytes = Uint8Array.from(atob(base64Jpg), c => c.charCodeAt(0));
                    const img = await pdfDoc.embedJpg(imageBytes);

                    let imgWidth = boxWidth - 2;
                    let imgHeight = (img.height / img.width) * imgWidth;

                    if (imgHeight > height - 2) {
                        imgHeight = height - 2;
                        imgWidth = (img.width / img.height) * imgHeight;
                    }

                    const imgX = margin + 1 + (boxWidth - 2 - imgWidth) / 2;
                    const imgY = y - height + 1 + (height - 2 - imgHeight) / 2;
                    page.drawImage(img, { x: imgX, y: imgY, width: imgWidth, height: imgHeight });

                    // Draw a little red target reticle to show the parcel location
                    const centerX = margin + boxWidth / 2;
                    const centerY = y - height / 2;
                    page.drawCircle({ x: centerX, y: centerY, size: 4, color: rgb(1, 0, 0) });
                    page.drawCircle({ x: centerX, y: centerY, size: 20, borderColor: rgb(1, 0, 0), borderWidth: 2 });

                    // Overlay: North Arrow and Address Context
                    if (title.includes("DP1")) {
                        // North Arrow (top right)
                        const nsX = margin + boxWidth - 30;
                        const nsY = y - 40;
                        page.drawLine({ start: { x: nsX, y: nsY - 15 }, end: { x: nsX, y: nsY + 15 }, thickness: 2, color: rgb(0, 0, 0) });
                        page.drawLine({ start: { x: nsX, y: nsY + 15 }, end: { x: nsX - 5, y: nsY + 5 }, thickness: 2, color: rgb(0, 0, 0) });
                        page.drawLine({ start: { x: nsX, y: nsY + 15 }, end: { x: nsX + 5, y: nsY + 5 }, thickness: 2, color: rgb(0, 0, 0) });
                        page.drawText("N", { x: nsX - 4, y: nsY + 20, size: 10, font: fontBold, color: rgb(0, 0, 0) });

                        // Address & Boundaries text box (bottom left)
                        const addressText = `Adresse: ${dp.terrain?.adresse || ''}, ${dp.terrain?.code_postal || ''} ${dp.terrain?.commune || ''}`;
                        const limitsText = `Limites séparatives et domaine public apparents`;

                        page.drawRectangle({ x: margin + 10, y: y - height + 10, width: 280, height: 40, color: rgb(1, 1, 1), opacity: 0.8 });
                        page.drawText(addressText, { x: margin + 15, y: y - height + 35, size: 8, font: fontBold, color: rgb(0, 0, 0) });
                        page.drawText(limitsText, { x: margin + 15, y: y - height + 20, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
                    }

                } catch (e) {
                    console.error("Failed to draw IGN image", e);
                    const textWidth = fontBold.widthOfTextAtSize("ERREUR DE LECTURE CARTE", 12);
                    page.drawText("ERREUR DE LECTURE CARTE", { x: (pageWidth - textWidth) / 2, y: y - height / 2, size: 12, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
                }
            } else {
                const textWidth = fontBold.widthOfTextAtSize("PIÈCE À JOINDRE DANS CE CADRE", 12);
                page.drawText("PIÈCE À JOINDRE DANS CE CADRE", { x: (pageWidth - textWidth) / 2, y: y - height / 2, size: 12, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
            }

            page.drawRectangle({ x: margin, y: y - height, width: boxWidth, height: height, borderColor: rgb(0, 0, 0), borderWidth: 1 });

            y -= height + 30;
        };

        const drawDP1QuadBox = async (img1Base: string | null, img2Base: string | null, img3Base: string | null, photoBase: string | null) => {
            const height = 500;
            if (y < margin + height + 50) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader();
            }

            page.drawText("DP1 – Plan de situation du terrain", { x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
            y -= 15;
            page.drawText("Localise la parcelle dans la commune (échelle 1/500 ou 1/2000, avec nord, limites, adresse).", { x: margin, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
            y -= 15;

            const boxWidth = pageWidth - margin * 2;
            page.drawRectangle({ x: margin, y: y - height, width: boxWidth, height: height, borderColor: rgb(0, 0, 0), borderWidth: 1 });

            const quadW = boxWidth / 2;
            const quadH = height / 2;

            const drawQuad = async (base64Data: string | null, isPng: boolean, isPhoto: boolean, qX: number, qY: number, title: string) => {
                page.drawRectangle({ x: qX, y: qY, width: quadW, height: quadH, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
                if (base64Data) {
                    try {
                        let bytes, img;
                        if (isPhoto) {
                            let cleanBase64 = base64Data;
                            if (base64Data.startsWith("/images/")) {
                                const fs = require('fs'); const path = require('path');
                                cleanBase64 = fs.readFileSync(path.join(process.cwd(), "public", base64Data)).toString("base64");
                            } else {
                                cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
                            }
                            bytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
                            img = base64Data.includes("png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
                        } else {
                            bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                            img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
                        }

                        let imgW = quadW - 2;
                        let imgH = (img.height / img.width) * imgW;
                        if (imgH > quadH - 2) {
                            imgH = quadH - 2;
                            imgW = (img.width / img.height) * imgH;
                        }
                        const cX = qX + 1 + (quadW - 2 - imgW) / 2;
                        const cY = qY + 1 + (quadH - 2 - imgH) / 2;
                        page.drawImage(img, { x: cX, y: cY, width: imgW, height: imgH });

                        if (!isPhoto) {
                            page.drawCircle({ x: qX + quadW / 2, y: qY + quadH / 2, size: 3, color: rgb(1, 0, 0) });
                            page.drawCircle({ x: qX + quadW / 2, y: qY + quadH / 2, size: 10, borderColor: rgb(1, 0, 0), borderWidth: 1.5 });

                            // Draw North Arrow top right of each map quad
                            const nsX = qX + quadW - 20;
                            const nsY = qY + quadH - 25;
                            page.drawLine({ start: { x: nsX, y: nsY - 8 }, end: { x: nsX, y: nsY + 8 }, thickness: 1.5, color: rgb(0, 0, 0) });
                            page.drawLine({ start: { x: nsX, y: nsY + 8 }, end: { x: nsX - 3, y: nsY + 3 }, thickness: 1.5, color: rgb(0, 0, 0) });
                            page.drawLine({ start: { x: nsX, y: nsY + 8 }, end: { x: nsX + 3, y: nsY + 3 }, thickness: 1.5, color: rgb(0, 0, 0) });
                            page.drawText("N", { x: nsX - 3, y: nsY + 12, size: 8, font: fontBold, color: rgb(0, 0, 0) });
                        }
                    } catch (e) {
                        console.error("erreur de rendu image/quad", e);
                    }
                }

                const textW = fontRegular.widthOfTextAtSize(title, 8);
                page.drawRectangle({ x: qX + 8, y: qY + 8, width: textW + 8, height: 14, color: rgb(1, 1, 1), opacity: 0.8, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
                page.drawText(title, { x: qX + 12, y: qY + 12, size: 8, font: fontRegular, color: rgb(0, 0, 0) });

                if (title.includes("1/25000") || title.includes("1/1700")) {
                    page.drawRectangle({ x: qX + 8, y: qY + 26, width: 230, height: 14, color: rgb(1, 1, 1), opacity: 0.8 });
                    page.drawText(`Adresse: ${dp.terrain?.adresse || ''}`, { x: qX + 12, y: qY + 30, size: 7, font: fontRegular, color: rgb(0, 0, 0) });
                }
            };

            const q1X = margin; const q1Y = y - quadH;
            const q2X = margin + quadW; const q2Y = y - quadH;
            const q3X = margin; const q3Y = y - height;
            const q4X = margin + quadW; const q4Y = y - height;

            await drawQuad(img1Base, false, false, q1X, q1Y, "Plan de situation dans la ville 1/25000");
            await drawQuad(img2Base, true, false, q2X, q2Y, "Plan cadastral 1/1700");
            await drawQuad(img3Base, false, false, q3X, q3Y, "Plan de situation de proximité 1/1700");
            await drawQuad(photoBase, false, true, q4X, q4Y, "Vue depuis la rue");

            y -= height + 30;
        };

        // --- PIÈCES OBLIGATOIRES ---
        const coords = await geocodeAddress(dp.terrain?.adresse || "", dp.terrain?.commune || "");
        let imgDP1_1 = null;
        let imgDP1_2 = null;
        let imgDP1_3 = null;
        let imgDP2 = null;

        if (coords) {
            imgDP1_1 = await getIgnMap(coords.lat, coords.lon, 2500, 'plan');
            imgDP1_2 = await getIgnMap(coords.lat, coords.lon, 150, 'cadastre');
            imgDP1_3 = await getIgnMap(coords.lat, coords.lon, 150, 'satellite');
            imgDP2 = await getIgnMap(coords.lat, coords.lon, 100, 'satellite');
        }

        // DP1 Plan de situation
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        if (dp.terrain?.dp1_mode === "classique") {
            await drawIgnMapBox("DP1 – Plan de situation du terrain", "Localise la parcelle dans la commune (échelle 1/500 ou 1/2000, avec nord, limites, adresse).", imgDP1_1, 500);
        } else {
            await drawDP1QuadBox(imgDP1_1, imgDP1_2, imgDP1_3, dp.photo_sets?.[0]?.base64_avant || null);
        }

        // DP2 Plan de masse
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        await drawIgnMapBox("DP2 – Plan de masse des constructions à édifier ou modifier", "Implantation précise sur le terrain (échelle 1/100-1/200) : Plan vue du dessus, orthophoto générée par Géoportail.", imgDP2, 500);

        // DP3 Plan en coupe
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader();
        drawPlaceholderBox("DP3 – Plan en coupe du terrain et de la construction", "Coupe verticale. Si insuffisant, complétez ce document avec une coupe dessinée.", 500);

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
            let firstPhotosPage = true;
            for (const [idx, ps] of dp.photo_sets.entries()) {
                if (firstPhotosPage || y < margin + 300) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader();

                    page.drawText("DP7 et DP8 – Photographies", { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0, 0) });
                    y -= 25;
                    firstPhotosPage = false;
                } else {
                    y -= 20;
                }

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
