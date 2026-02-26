import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const city = searchParams.get("city");

    if (!address || !city) {
        return NextResponse.json({ success: false, error: "Adresse ou ville manquante" }, { status: 400 });
    }

    try {
        const query = encodeURIComponent(`${address}, ${city}, France`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
            headers: { "User-Agent": "DeclarationPrealableApp/1.0", "Accept-Language": "fr" }
        });
        const data = await res.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            const getIgnMapUrl = (sizeMeters: number, type: 'plan' | 'satellite' | 'cadastre') => {
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
                return `https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bbox}&CRS=EPSG:4326&WIDTH=600&HEIGHT=400&LAYERS=${layer}&STYLES=&FORMAT=${format}`;
            };

            return NextResponse.json({
                success: true,
                maps: {
                    dp1_1: getIgnMapUrl(2500, 'plan'),
                    dp1_2: getIgnMapUrl(150, 'cadastre'),
                    dp1_3: getIgnMapUrl(150, 'satellite'),
                    dp2: getIgnMapUrl(100, 'satellite')
                }
            });
        } else {
            return NextResponse.json({ success: false, error: "Adresse introuvable" }, { status: 404 });
        }
    } catch (error: any) {
        console.error("Map Preview API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
