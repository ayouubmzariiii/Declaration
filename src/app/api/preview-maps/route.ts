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

            const getIgnMapUrl = (sizeMeters: number, type: 'plan' | 'satellite') => {
                const latDiff = (sizeMeters / 2) / 111320;
                const lonDiff = (sizeMeters / 2) / (111320 * Math.cos(lat * Math.PI / 180));

                const minLat = lat - latDiff;
                const maxLat = lat + latDiff;
                const minLon = lon - lonDiff;
                const maxLon = lon + lonDiff;

                const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
                const layer = type === 'plan' ? 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' : 'ORTHOIMAGERY.ORTHOPHOTOS';
                return `https://wxs.ign.fr/essentiels/geoportail/r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bbox}&CRS=EPSG:4326&WIDTH=600&HEIGHT=400&LAYERS=${layer}&STYLES=normal&FORMAT=image/jpeg`;
            };

            const mapDP1Url = getIgnMapUrl(800, 'plan');
            const mapDP2Url = getIgnMapUrl(100, 'satellite');

            return NextResponse.json({
                success: true,
                maps: {
                    dp1: mapDP1Url,
                    dp2_dp3: mapDP2Url
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
