import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Kamu adalah AI pakar halal dengan kemampuan vision (penglihatan) super.
Tugas kamu adalah menganalisis gambar kemasan produk, logo, dan daftar komposisinya.

TUGAS UTAMA:
1. PERIKSA LOGO HALAL: Cari logo Sertifikasi Halal resmi dari berbagai negara (seperti MUI/BPJPH Indonesia, JAKIM Malaysia, MUIS Singapura, HFA/Halal Authority Board UK, AFIC Australia, IFANCA USA, dll).
2. BACA KOMPOSISI: Ekstrak secara teliti *semua* teks bahan/komposisi (ingredients) yang ada di gambar kemasan.
3. ANALISIS STATUS: Tentukan status halal setiap bahan (safe/warning/danger).
4. KESIMPULAN VERDICT: Berikan verdict akhir produk:
   - Jika ADA Logo Halal RESMI → "HALAL" (meskipun komposisi kurang jelas).
   - Jika tidak ada logo, dan ada SATU bahan haram → "HARAM".
   - Jika tidak ada logo, dan ada bahan meragukan (seperti gelatin tanpa sumber) → "SYUBHAT".
   - Jika tidak ada logo, tapi seluruh bahan alami nabati/aman → "HALAL".

TOLOK UKUR BAHAN HARAM/SYUBHAT:
- HARAM: Gelatin babi, lard, pepsin babi, carmine (E120), mirin, wine, rum, beer, sake, bacon, ham, E441, E904 (shellac)
- SYUBHAT: Gelatin (tanpa sumber), mono/diglycerides (E471), natural flavor, vanilla extract, whey, rennet, E322 (lecithin), E631, E635

FORMAT OUTPUT JSON (HARUS PERSIS SEPERTI INI):
{
  "halalLogo": true/false,
  "logoDetails": "Jika ada, sebutkan nama lembaga. Cth: LPPOM MUI Indonesia / JAKIM Malaysia. Jika tidak, isi string kosong",
  "ingredients": [
    { "name": "Gula", "status": "safe|warning|danger", "note": "Keterangan singkat" }
  ],
  "overallVerdict": "HALAL|SYUBHAT|HARAM",
  "confidence": 0.85,
  "summary": "Analisis singkat (misal: Produk halal karena terdapat logo MUI / Mengandung gelatin yang belum jelas sumbernya)"
}`;

export async function POST(request) {
    try {
        const payload = await request.json();
        const hasText = payload.text && payload.text.trim().length > 0;
        const hasImage = payload.image && payload.image.trim().length > 0;

        if (!hasText && !hasImage) {
            return NextResponse.json({ error: 'No image or text provided' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({
                error: 'NO_API_KEY',
                message: 'Gemini API key not configured. Using local analysis.'
            }, { status: 200 });
        }

        // Build content array
        const parts = [{ text: SYSTEM_PROMPT }];

        if (hasImage) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: payload.image // Expecting raw base64 string
                }
            });
            parts.push({ text: "\n\nTolong baca seluruh kemasan, deteksi apakah ada logo Halal dari negara manapun, dan ekstrak semua komposisinya untuk dianalisis dalam format JSON." });
        } else if (hasText) {
            parts.push({
                text: `\n\n---\nTEKS KOMPOSISI PRODUK (DIMASUKKAN MANUAL):\n${payload.text}\n---\n\nAnalisis teks ini sesuai instruksi dan kembalikan JSON.`
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.1, // Low temp for extraction accuracy
                        maxOutputTokens: 2048,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return NextResponse.json({
                error: 'AI_ERROR',
                message: 'Failed to analyze with AI. Using local analysis.'
            }, { status: 200 });
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            return NextResponse.json({
                error: 'AI_EMPTY',
                message: 'AI returned empty response. Using local analysis.'
            }, { status: 200 });
        }

        let analysisResult;
        try {
            analysisResult = JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[1].trim());
            } else {
                throw new Error('Could not parse AI response as JSON');
            }
        }

        return NextResponse.json(analysisResult);

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({
            error: 'SERVER_ERROR',
            message: error.message
        }, { status: 500 });
    }
}
