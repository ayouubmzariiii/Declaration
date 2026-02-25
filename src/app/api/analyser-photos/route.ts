import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { model, custom_prompt, temperature, max_tokens, photos_avant, photos_apres } = body;

        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Clé API NVIDIA non configurée." }, { status: 500 });
        }

        // Prepare messages array for the NVIDIA API
        const messages: any[] = [];
        const imageContent: any[] = [];

        // Attach all photos (converting data:image/...;base64,... back out to pure base64 for API)
        const allPhotos = [...(photos_avant || []), ...(photos_apres || [])];

        // We only support first 2 photos due to typical API limits, or all if model supports it
        // Nemotron supports multiple images in the message array
        for (const base64DataUrl of allPhotos) {
            if (!base64DataUrl) continue;
            let base64Clean = "";
            let mimeType = "image/jpeg";

            if (base64DataUrl.startsWith("/images/")) {
                const fs = require('fs');
                const path = require('path');
                const filePath = path.join(process.cwd(), "public", base64DataUrl);
                const fileBuffer = fs.readFileSync(filePath);
                base64Clean = fileBuffer.toString("base64");
            } else {
                base64Clean = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
                if (base64DataUrl.includes("image/png")) mimeType = "image/png";
            }

            imageContent.push({
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Clean}` }
            });
        }

        // Add text prompt
        imageContent.push({
            type: "text",
            text: custom_prompt
        });

        let apiModelName = "nvidia/nemotron-nano-12b-v2-vl";
        let systemContent = "Tu es un expert en urbanisme français. Réponds UNIQUEMENT en JSON valide. Commence par { et finis par }.";

        if (model === "nemotron") {
            systemContent = "/no_think\nTu es un expert en urbanisme français. Réponds UNIQUEMENT en JSON.";
        } else if (model === "qwen") {
            apiModelName = "qwen/qwen3.5-397b-a17b";
        }

        messages.push({
            role: "system",
            content: systemContent
        });

        messages.push({
            role: "user",
            content: imageContent
        });

        console.log(`[API] Calling NVIDIA API (Model: ${model}, Images: ${allPhotos.length})`);

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                model: apiModelName,
                messages: messages,
                temperature: temperature || 0.3,
                max_tokens: max_tokens || 4096,
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`NVIDIA API Error (${response.status}):`, errText);
            return NextResponse.json({ success: false, error: `Erreur API IA: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || "";

        // Parse JSON from markdown output
        let jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        let parsedData = {};

        try {
            if (jsonMatch && jsonMatch[1]) {
                parsedData = JSON.parse(jsonMatch[1]);
            } else {
                const start = rawContent.indexOf("{");
                const end = rawContent.lastIndexOf("}");
                if (start !== -1 && end !== -1) {
                    parsedData = JSON.parse(rawContent.substring(start, end + 1));
                } else {
                    parsedData = JSON.parse(rawContent); // fallback
                }
            }
        } catch (e) {
            console.error("Failed to parse AI JSON:", rawContent);
            return NextResponse.json({ success: false, error: "L'IA a généré une réponse invalide (non JSON)." }, { status: 500 });
        }

        // Partition the flat parsedData into Notice and Aspect groups for the frontend
        const noticeFields = [
            "etat_initial", "etat_projete", "justification", "insertion_paysagere",
            "impact_environnemental", "modifications_detaillees", "modification_volume",
            "modification_emprise_au_sol", "modification_surface_plancher",
            "hauteur_estimee_existante", "hauteur_estimee_projete",
            "coherence_architecturale", "risques_reglementaires_potentiels", "niveau_confiance_global"
        ];

        const aspectFields = [
            "facade_materiaux_existants", "facade_materiaux_projetes",
            "menuiseries_existantes", "menuiseries_projetees",
            "toiture_materiaux_existants", "toiture_materiaux_projetes",
            "couleur_facade", "couleur_menuiseries", "couleur_volets", "couleur_toiture",
            "nombre_ouvertures_existantes", "nombre_ouvertures_projetees"
        ];

        const notice: any = {};
        const aspect: any = {};

        noticeFields.forEach(f => { if (parsedData[f as keyof typeof parsedData]) notice[f] = parsedData[f as keyof typeof parsedData]; });
        aspectFields.forEach(f => { if (parsedData[f as keyof typeof parsedData]) aspect[f] = parsedData[f as keyof typeof parsedData]; });

        return NextResponse.json({
            success: true,
            notice,
            aspect
        });

    } catch (error: any) {
        console.error("Server API Route Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
