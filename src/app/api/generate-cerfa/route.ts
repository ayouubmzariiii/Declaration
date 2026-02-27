import { NextResponse } from "next/server";
import { DeclarationPrealable, getInitialDP } from "@/lib/models";
import { generateCerfaPDF } from "@/lib/pdfGenerator";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const dp: DeclarationPrealable = body.dp || getInitialDP();

        const pdfBytes = await generateCerfaPDF(dp);

        return new NextResponse(pdfBytes as any, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="cerfa_${dp.reference || 'dossier'}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("Cerfa Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
