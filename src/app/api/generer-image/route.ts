import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, imageBase64 } = body;

        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Clé API NVIDIA non configurée." }, { status: 500 });
        }

        if (!imageBase64 || !prompt) {
            return NextResponse.json({ success: false, error: "Image source et description requises." }, { status: 400 });
        }

        // Clean up the base64 string
        let cleanBase64 = imageBase64;
        let mimeType = "image/jpeg";
        if (cleanBase64.startsWith("/images/")) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(process.cwd(), "public", cleanBase64);
            const fileBuffer = fs.readFileSync(filePath);
            cleanBase64 = fileBuffer.toString("base64");
            if (filePath.endsWith(".png")) mimeType = "image/png";
        } else {
            const match = cleanBase64.match(/^data:(image\/\w+);base64,(.*)$/);
            if (match) {
                mimeType = match[1];
                cleanBase64 = match[2];
            }
        }

        const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

        const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev";
        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        const payload = {
            "prompt": prompt,
            "image": dataUrl,
            "aspect_ratio": "match_input_image",
            "steps": 30,
            "cfg_scale": 3.5,
            "seed": 0
        };

        const response = await fetch(invokeUrl, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: headers
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("NVIDIA GenAI Error:", response.status, errBody);
            return NextResponse.json({ success: false, error: "Erreur lors de la génération." }, { status: response.status });
        }

        const responseBody = await response.json();

        // Return the body as-is so frontend can extract the base64
        return NextResponse.json({ success: true, data: responseBody });

    } catch (error: any) {
        console.error("Server API Route Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
