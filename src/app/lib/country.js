// Country name variants (highest priority for matching)
const countryNames = {
    'indonesia': ['indonesia'],
    'malaysia': ['malaysia'],
    'singapura': ['singapore', 'singapura'],
    'thailand': ['thailand'],
    'jepang': ['japan', 'jepang', 'nippon'],
    'korea': ['korea'],
    'turki': ['turkey', 'turki', 'türkiye'],
    'uae': ['united arab emirates', 'uae'],
    'arab-saudi': ['saudi arabia', 'saudi'],
    'mesir': ['egypt', 'mesir'],
    'india': ['india'],
    'uk': ['united kingdom', 'england', 'inggris'],
    'australia': ['australia'],
    'amerika': ['united states', 'usa', 'u.s.a'],
};

// City keywords (only used if no country name matched)
const cityKeywords = {
    'indonesia': ['jakarta', 'bandung', 'surabaya', 'yogyakarta', 'bali', 'medan', 'semarang', 'makassar', 'denpasar', 'malang', 'solo', 'bogor', 'depok', 'tangerang', 'bekasi', 'palembang', 'karangasem', 'gianyar', 'tabanan', 'badung', 'buleleng', 'klungkung', 'bangli', 'jembrana', 'lombok', 'mataram'],
    'malaysia': ['kuala lumpur', 'penang', 'johor', 'melaka', 'kota kinabalu', 'langkawi', 'putrajaya', 'selangor', 'sabah', 'sarawak'],
    'singapura': [],
    'thailand': ['bangkok', 'phuket', 'chiang mai', 'pattaya'],
    'jepang': ['tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya'],
    'korea': ['seoul', 'busan', 'incheon', 'daegu'],
    'turki': ['istanbul', 'ankara', 'antalya'],
    'uae': ['dubai', 'abu dhabi', 'sharjah'],
    'arab-saudi': ['riyadh', 'jeddah', 'mecca', 'medina', 'makkah', 'madinah'],
    'mesir': ['cairo', 'alexandria'],
    'india': ['mumbai', 'delhi', 'hyderabad', 'bangalore', 'chennai', 'kolkata'],
    'uk': ['london', 'manchester', 'birmingham'],
    'australia': ['sydney', 'melbourne', 'brisbane', 'perth'],
    'amerika': ['new york', 'los angeles', 'chicago', 'houston'],
};

// Map country names (like "Amerika Serikat") back to their slug for the search page
const nameToSlug = {
    'indonesia': 'indonesia',
    'malaysia': 'malaysia',
    'singapura': 'singapura',
    'thailand': 'thailand',
    'jepang': 'jepang',
    'korea selatan': 'korea',
    'turki': 'turki',
    'uae': 'uae',
    'arab saudi': 'arab-saudi',
    'mesir': 'mesir',
    'india': 'india',
    'inggris': 'uk',
    'australia': 'australia',
    'amerika serikat': 'amerika',
};

export function getCountrySlugFromName(name) {
    if (!name) return null;
    return nameToSlug[name.toLowerCase()] || null;
}

export function getCountryForAddress(address) {
    if (!address) return null;
    const lower = address.toLowerCase();

    // Helper to check whole words
    const containsWord = (text, word) => {
        // Escape special regex chars just in case, though our keywords are safe
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    };

    // Pass 1: Check country names first (highest priority)
    for (const [slug, names] of Object.entries(countryNames)) {
        if (names.some(n => containsWord(lower, n))) return slug;
    }

    // Pass 2: Check city keywords (only if no country name matched)
    for (const [slug, cities] of Object.entries(cityKeywords)) {
        if (cities.some(c => containsWord(lower, c))) return slug;
    }

    return null;
}

export function matchesCountry(address, slug) {
    return getCountryForAddress(address) === slug;
}
