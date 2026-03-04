// ============================================
// 📚 Halal Ingredient Database
// Built-in reference for haram/syubhat ingredients
// Used for offline analysis & augmenting AI results
// ============================================

export const HARAM_INGREDIENTS = [
    // --- Animal-derived (pork) ---
    { name: 'Gelatin (Pork)', aliases: ['pork gelatin', 'gelatin babi', 'pigskin gelatin'], status: 'haram', category: 'animal', reason: 'Berasal dari kulit/tulang babi' },
    { name: 'Lard', aliases: ['lard', 'lemak babi', 'pork fat', 'manteca de cerdo'], status: 'haram', category: 'animal', reason: 'Lemak babi murni' },
    { name: 'Pepsin (Pork)', aliases: ['pepsin', 'pork pepsin'], status: 'haram', category: 'animal', reason: 'Enzim dari lambung babi' },
    { name: 'Bacon', aliases: ['bacon', 'bacon bits', 'bacon flavor'], status: 'haram', category: 'animal', reason: 'Daging babi olahan' },
    { name: 'Ham', aliases: ['ham', 'pork ham'], status: 'haram', category: 'animal', reason: 'Daging babi olahan' },
    { name: 'Prosciutto', aliases: ['prosciutto'], status: 'haram', category: 'animal', reason: 'Daging babi Italia' },
    { name: 'Pancetta', aliases: ['pancetta'], status: 'haram', category: 'animal', reason: 'Daging babi Italia' },
    { name: 'Chorizo (Pork)', aliases: ['pork chorizo'], status: 'haram', category: 'animal', reason: 'Sosis babi Spanyol' },

    // --- Alcohol-based ---
    { name: 'Mirin', aliases: ['mirin', 'hon mirin'], status: 'haram', category: 'alcohol', reason: 'Mengandung ~14% alkohol dari fermentasi beras' },
    { name: 'Wine', aliases: ['wine', 'red wine', 'white wine', 'cooking wine', 'anggur'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol dari anggur' },
    { name: 'Rum', aliases: ['rum', 'rum extract', 'rum flavor'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol dari tebu' },
    { name: 'Beer', aliases: ['beer', 'bir', 'beer extract'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol dari hop & barley' },
    { name: 'Sake', aliases: ['sake', 'nihonshu'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol Jepang dari beras' },
    { name: 'Brandy', aliases: ['brandy', 'cognac'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol dari anggur suling' },
    { name: 'Bourbon', aliases: ['bourbon', 'whiskey', 'whisky'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol dari gandum' },
    { name: 'Liqueur', aliases: ['liqueur', 'amaretto', 'kahlua', 'grand marnier'], status: 'haram', category: 'alcohol', reason: 'Minuman beralkohol manis' },

    // --- E-codes (HARAM) ---
    { name: 'E120 (Carmine)', aliases: ['e120', 'carmine', 'cochineal', 'karmin', 'pewarna merah cochineal'], status: 'haram', category: 'insect', reason: 'Pewarna merah dari serangga cochineal — mayoritas ulama menganggap haram' },
    { name: 'E441 (Gelatin)', aliases: ['e441'], status: 'haram', category: 'animal', reason: 'Gelatin — biasanya dari babi kecuali disebutkan halal' },
    { name: 'E542 (Bone Phosphate)', aliases: ['e542', 'bone phosphate'], status: 'haram', category: 'animal', reason: 'Fosfat dari tulang hewan (kemungkinan babi)' },
    { name: 'E904 (Shellac)', aliases: ['e904', 'shellac', 'lac', 'confectioner glaze'], status: 'haram', category: 'insect', reason: 'Resin dari serangga lac — dipermasalahkan status halalnya' },
];

export const SYUBHAT_INGREDIENTS = [
    // --- Doubtful / needs verification ---
    { name: 'Gelatin', aliases: ['gelatin', 'gelatine', 'gelatin sapi', 'bovine gelatin'], status: 'syubhat', category: 'animal', reason: 'Bisa dari sapi halal atau babi — perlu konfirmasi sumber & proses penyembelihan' },
    { name: 'Rennet', aliases: ['rennet', 'rennin', 'animal rennet'], status: 'syubhat', category: 'animal', reason: 'Enzim dari lambung anak sapi — perlu konfirmasi proses penyembelihan' },
    { name: 'Whey', aliases: ['whey', 'whey protein', 'whey powder'], status: 'syubhat', category: 'dairy', reason: 'Bisa mengandung rennet dari sumber non-halal' },
    { name: 'Mono/Diglycerides', aliases: ['mono and diglycerides', 'monoglycerides', 'diglycerides', 'mono- and diglycerides'], status: 'syubhat', category: 'fat', reason: 'Bisa dari lemak hewani (termasuk babi) atau nabati' },
    { name: 'Natural Flavor', aliases: ['natural flavor', 'natural flavoring', 'natural flavors', 'perisa alami'], status: 'syubhat', category: 'flavoring', reason: 'Bisa berasal dari sumber hewani atau nabati — tidak transparan' },
    { name: 'Vanilla Extract', aliases: ['vanilla extract', 'ekstrak vanila'], status: 'syubhat', category: 'alcohol', reason: 'Biasanya mengandung alkohol sebagai pelarut (~35%)' },

    // --- E-codes (SYUBHAT) ---
    { name: 'E322 (Lecithin)', aliases: ['e322', 'lecithin', 'soy lecithin', 'lesitin'], status: 'syubhat', category: 'emulsifier', reason: 'Biasanya dari kedelai (halal), tapi bisa dari telur atau sumber hewani lain' },
    { name: 'E471 (Emulsifier)', aliases: ['e471', 'mono and diglycerides of fatty acids'], status: 'syubhat', category: 'emulsifier', reason: 'Bisa dari lemak hewan (termasuk babi) atau nabati' },
    { name: 'E472 (Esters)', aliases: ['e472', 'e472a', 'e472b', 'e472c', 'e472e'], status: 'syubhat', category: 'emulsifier', reason: 'Ester dari asam lemak — sumber bisa hewani atau nabati' },
    { name: 'E631 (Disodium Inosinate)', aliases: ['e631', 'disodium inosinate', 'inosinat'], status: 'syubhat', category: 'flavor_enhancer', reason: 'Bisa dari ikan (halal) atau daging babi' },
    { name: 'E635 (Disodium Ribonucleotides)', aliases: ['e635', 'disodium ribonucleotides'], status: 'syubhat', category: 'flavor_enhancer', reason: 'Campuran E631 + E627 — perlu cek sumber' },
    { name: 'E476 (PGPR)', aliases: ['e476', 'polyglycerol polyricinoleate', 'pgpr'], status: 'syubhat', category: 'emulsifier', reason: 'Bisa dari gliserol hewani atau nabati' },
    { name: 'E491-E495 (Sorbitan Esters)', aliases: ['e491', 'e492', 'e493', 'e494', 'e495', 'sorbitan monostearate'], status: 'syubhat', category: 'emulsifier', reason: 'Ester sorbitan dari asam lemak — sumber perlu dicek' },
];

/**
 * Analyze ingredients against the local database.
 * Returns array of { name, status, reason } for each matched ingredient.
 */
export function analyzeWithLocalDB(ingredientText) {
    const text = ingredientText.toLowerCase();
    const results = [];
    const allIngredients = [...HARAM_INGREDIENTS, ...SYUBHAT_INGREDIENTS];

    for (const item of allIngredients) {
        const allNames = [item.name.toLowerCase(), ...item.aliases.map(a => a.toLowerCase())];
        for (const alias of allNames) {
            if (text.includes(alias)) {
                // Avoid duplicates
                if (!results.find(r => r.name === item.name)) {
                    results.push({
                        name: item.name,
                        status: item.status === 'haram' ? 'danger' : 'warning',
                        note: item.reason,
                        category: item.category,
                    });
                }
                break;
            }
        }
    }

    return results;
}

/**
 * Parse ingredient text into individual ingredient names.
 */
export function parseIngredientList(text) {
    // Split by common delimiters: comma, semicolon, newline, bullet points
    return text
        .replace(/\([^)]*\)/g, '') // Remove parenthetical info
        .split(/[,;\n•·]/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && s.length < 100);
}
