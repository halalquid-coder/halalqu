import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Kamu adalah AI pakar halal yang menganalisis daftar bahan/komposisi produk makanan.

TUGAS:
1. Parse setiap bahan dari teks yang diberikan
2. Analisis status halal setiap bahan
3. Berikan verdict: "safe" (halal), "warning" (syubhat/meragukan), "danger" (haram/non-halal)

REFERENSI BAHAN KRITIS:
- HARAM: Gelatin babi, lard, pepsin babi, carmine (E120), mirin, wine, rum, beer, sake, bacon, ham, E441 (gelatin), E904 (shellac)
- SYUBHAT: Gelatin (tanpa keterangan sumber), mono/diglycerides (E471), natural flavor, vanilla extract, whey, rennet, E322 (lecithin), E631, E635
- HALAL: Gula, garam, tepung, beras, air, minyak nabati, kedelai, jagung, vitamin, mineral, asam sitrat, natrium bikarbonat

OUTPUT FORMAT (selalu dalam JSON):
{
  "ingredients": [
    { "name": "Nama Bahan", "status": "safe|warning|danger", "note": "Penjelasan singkat" }
  ],
  "overallVerdict": "HALAL|SYUBHAT|HARAM",
  "confidence": 0.85,
  "summary": "Ringkasan hasil analisis"
}

ATURAN:
- Jika ada SATU bahan haram → overallVerdict = "HARAM"
- Jika ada bahan syubhat tapi tidak ada haram → overallVerdict = "SYUBHAT"
- Jika semua aman → overallVerdict = "HALAL"
- Selalu berikan penjelasan dalam Bahasa Indonesia
- confidence antara 0.0 - 1.0 berdasarkan kejelasan teks OCR`;

export async function POST(request) {
    try {
        const { text } = await request.json();

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'No ingredient text provided' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({
                error: 'NO_API_KEY',
                message: 'Gemini API key not configured. Using local analysis.'
            }, { status: 200 });
        }

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${SYSTEM_PROMPT}\n\n---\nTEKS KOMPOSISI PRODUK:\n${text}\n---\n\nAnalisis bahan-bahan di atas. Jawab HANYA dalam format JSON yang diminta.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
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

        // Extract the text content from Gemini response
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            return NextResponse.json({
                error: 'AI_EMPTY',
                message: 'AI returned empty response. Using local analysis.'
            }, { status: 200 });
        }

        // Parse JSON from response
        let analysisResult;
        try {
            // Try direct parse first
            analysisResult = JSON.parse(content);
        } catch {
            // Try extracting JSON from markdown code block
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
