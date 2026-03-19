import { notFound } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';
import Script from 'next/script';

export const revalidate = 86400; // Cache for 24 hours (ISR)

const CITIES = ["jakarta", "bandung", "surabaya", "medan", "makassar", "yogyakarta", "semarang", "bali"];
const CATEGORIES = ["sushi", "kopi", "ayam", "bakso", "mie-ayam", "nasi-padang", "martabak", "dessert", "cafe", "restoran", "street-food", "ramen"];

// Helper to Capitalize
const capitalize = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const categoryslug = resolvedParams.category;
    const cityslug = resolvedParams.city;

    if (!categoryslug.endsWith('-halal')) return {};

    const baseCat = categoryslug.replace('-halal', '');
    const titleCat = capitalize(baseCat);
    const titleCity = capitalize(cityslug);

    return {
        title: `${titleCat} Halal di ${titleCity}: Rekomendasi Terlengkap & Terbaik 2026 | Halalqu`,
        description: `Temukan daftar tempat makan ${titleCat.toLowerCase()} halal di ${titleCity} lengkap dengan review, alamat, dan status sertifikat halal. Gunakan Halalqu untuk mencari kuliner yang aman dan terjamin kehalalannya di ${titleCity}.`,
        openGraph: {
            title: `${titleCat} Halal di ${titleCity}`,
            description: `Rekomendasi ${titleCat.toLowerCase()} halal pilihan di ${titleCity}.`,
            type: 'website',
        }
    };
}

export default async function ProgrammaticSeoPage({ params }) {
    const resolvedParams = await params;
    const { category, city } = resolvedParams;

    // Only catch SEO routes ending with -halal
    if (!category.endsWith('-halal')) {
        return notFound();
    }

    const baseCat = category.replace('-halal', '').replace(/-/g, ' ').toLowerCase();
    const cityStr = city.replace(/-/g, ' ').toLowerCase();

    const titleCat = capitalize(baseCat.replace(/ /g, '-'));
    const titleCity = capitalize(city);

    // Fetch dynamic data from Firebase
    let matchedPlaces = [];
    try {
        const q = query(collection(db, 'places'), where('status', '==', 'approved'));
        const snap = await getDocs(q);
        const allPlaces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        matchedPlaces = allPlaces.filter(p => {
            const pAddr = (p.address || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pCat = (p.category || '').toLowerCase();
            const pNotes = (p.description || '').toLowerCase();

            // Match City
            const isCityMatch = pAddr.includes(cityStr);

            // Match Category: (Sushi, Kopi, Ayam, dll)
            // Cek nama, kategori, atau deskripsi
            const isCatMatch = pName.includes(baseCat) || pCat.includes(baseCat) || pNotes.includes(baseCat);

            return isCityMatch && isCatMatch;
        });
    } catch (e) {
        console.error("Error fetching places for SEO:", e);
    }

    // JSON-LD Schema
    const schemaMarkup = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": matchedPlaces.map((place, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Restaurant",
                "name": place.name,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": titleCity,
                    "streetAddress": place.address,
                    "addressCountry": "ID"
                },
                "servesCuisine": titleCat,
                "url": `https://halalqu.online/restaurant/${place.id}`
            }
        }))
    };

    // Internal Linking Randomizer
    const randomCities = [...CITIES].sort(() => 0.5 - Math.random()).slice(0, 3);
    const randomCats = [...CATEGORIES].sort(() => 0.5 - Math.random()).slice(0, 3);

    return (
        <>
            <Script id="schema-markup" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />

            <div className="page container" style={{ paddingTop: 'var(--space-md)' }}>
                {/* Breadcrumb */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    <Link href="/" style={{ color: 'var(--halalqu-green)' }}>Home</Link> &gt; {titleCat} Halal &gt; {titleCity}
                </div>

                {/* Hero Header SEO */}
                <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3, color: 'var(--charcoal)' }}>
                    {titleCat} Halal di {titleCity}: Rekomendasi Terdekat & Terbaik 2026
                </h1>
                
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Mencari <strong>{titleCat.toLowerCase()} halal di {titleCity}</strong> kini semakin mudah. 
                    Halalqu telah menyeleksi dan memverifikasi daftar tempat makan yang menyajikan kuliner {titleCat.toLowerCase()} dengan bahan-bahan yang aman.
                    Temukan {titleCat.toLowerCase()} terdekat dari lokasi Anda lengkap dengan review jujur pengguna, alamat, jam buka, dan tentu saja status sertifikasi halal MUI atau klaim mandiri yang jelas.
                </p>

                {/* Restaurant List */}
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                    🍣 Daftar Tempat {titleCat} Halal - {titleCity} ({matchedPlaces.length})
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    {matchedPlaces.length > 0 ? (
                        matchedPlaces.map((place) => {
                            const isCertified = place.halalTypes?.includes('certified');
                            return (
                                <Link href={`/restaurant/${place.id}`} key={place.id} style={{ display: 'flex', textDecoration: 'none', color: 'inherit', background: 'var(--white)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', gap: 'var(--space-md)' }}>
                                    <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg)' }}>
                                        {place.imageUrl ? (
                                            <img src={place.imageUrl} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🍽️</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {place.name}
                                        </h3>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            📍 {place.address}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: isCertified ? 'var(--halalqu-green-light)' : '#FEF3C7', color: isCertified ? 'var(--halalqu-green)' : '#D97706', fontWeight: 600 }}>
                                                {isCertified ? '✅ Sertifikat Halal' : '🕌 Klaim Mandiri'}
                                            </span>
                                            {place.category && (
                                                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                                                    {place.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', background: '#F9FAFB', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border)' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🤖</div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '4px' }}>Belum Ada Data ({titleCat})</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada rekomendasi tempat makan untuk kategori ini di <strong>{titleCity}</strong>. Jadilah yang pertama memberikan rekomendasi di Halalqu!</p>
                            <Link href="/add-place" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '16px', padding: '8px 16px', fontSize: '13px' }}>+ Tambah Tempat</Link>
                        </div>
                    )}
                </div>

                {/* Auto FAQ (SEO GOLD) */}
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--charcoal)' }}>❓ Pertanyaan Seputar {titleCat} Halal di {titleCity}</h2>
                    
                    <div style={{ background: 'var(--white)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Apakah semua {titleCat.toLowerCase()} di {titleCity} aman dikonsumsi Muslim?</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tidak semua aman. Pastikan tidak ada penggunaan mirin, sake, angciu, atau kuah babi dalam proses pembuatannya. Selalu periksa label "Sertifikat Halal" atau review di Halalqu.</p>
                    </div>

                    <div style={{ background: 'var(--white)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Apa bedanya Sertifikat Halal vs Klaim Mandiri?</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sertifikat Halal adalah legalitas resmi dari lembaga sperti MUI/BPJPH. Klaim Mandiri berarti tempat dikelola oleh Muslim tanpa alkohol & babi, direkomendasikan secara komunitas.</p>
                    </div>

                    <div style={{ background: 'var(--white)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Dimana {titleCat.toLowerCase()} halal terdekat di {titleCity}?</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Anda dapat menggunakan fitur Peta Halalqu melalui tombol di atas untuk melihat warung atau restoran {titleCat.toLowerCase()} yang paling dekat dari lokasi Anda sekarang (near me).</p>
                    </div>
                </div>

                {/* Internal Linking (SEO CRITICAL) */}
                <div style={{ background: '#F4F6F8', padding: 'var(--space-lg)', margin: '0 calc(-1 * var(--space-lg)) var(--space-xl) calc(-1 * var(--space-lg))' }}>
                    <div className="container">
                        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--charcoal)' }}>Lihat Juga:</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {randomCities.map(rc => (
                                <Link key={rc} href={`/${category.toLowerCase()}/${rc.toLowerCase()}`} style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 500, textDecoration: 'none' }}>
                                    🍲 {titleCat} Halal di {capitalize(rc)}
                                </Link>
                            ))}
                            {randomCats.map(rc => (
                                <Link key={rc} href={`/${rc.toLowerCase()}-halal/${city.toLowerCase()}`} style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 500, textDecoration: 'none' }}>
                                    🍜 {capitalize(rc)} Halal di {titleCity}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* UGC Banner */}
                <div style={{ background: 'linear-gradient(135deg, var(--halalqu-green), #14532D)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', color: 'white', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>⭐</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Bantu Komunitas Muslim Lainnya</h3>
                    <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>Punya langganan {titleCat.toLowerCase()} halal favorit yang belum terdaftar di {titleCity}? Tambahkan sekarang.</p>
                    <Link href="/add-place" className="btn" style={{ background: 'white', color: 'var(--halalqu-green)', width: '100%', display: 'block', fontWeight: 700, borderRadius: 'var(--radius-md)', padding: '12px' }}>
                        + Tulis Review & Tambah Lokasi
                    </Link>
                </div>
            </div>
        </>
    );
}
