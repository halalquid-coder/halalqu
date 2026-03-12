'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const countryData = {
    'indonesia': {
        emoji: '🇮🇩', name: 'Indonesia', color: '#DC2626',
        desc: 'Negeri halal terbesar di dunia dengan ragam kuliner nusantara yang kaya.',
        tips: 'Cari logo halal MUI atau BPJPH pada restoran dan produk kemasan.',
        certBody: 'MUI / BPJPH',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
            { emoji: '🥘', label: 'Fine Dining', query: 'Fine Dining' },
            { emoji: '🍰', label: 'Bakery', query: 'Bakery' },
            { emoji: '🥤', label: 'Minuman', query: 'Minuman' },
            { emoji: '🧁', label: 'Dessert', query: 'Dessert' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '👗', label: 'Fashion Muslim', query: 'Fashion Muslim' },
            { emoji: '💊', label: 'Kesehatan & Kosmetik', query: 'Kesehatan, Herbal & Kosmetik' },
            { emoji: '👶', label: 'Ibu, Bayi & Anak', query: 'Ibu, Bayi & Anak' },
            { emoji: '🏠', label: 'Rumah Tangga', query: 'Peralatan Rumah Tangga & Gaya Hidup' },
        ],
    },
    'malaysia': {
        emoji: '🇲🇾', name: 'Malaysia', color: '#1D4ED8',
        desc: 'Pusat industri halal global dengan sertifikasi JAKIM yang diakui internasional.',
        tips: 'Logo halal JAKIM wajib ditampilkan di restoran. Cari juga logo JAS di produk.',
        certBody: 'JAKIM',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '☕', label: 'Cafe & Kopitiam', query: 'Cafe' },
            { emoji: '🍛', label: 'Mamak & Street Food', query: 'Street Food' },
            { emoji: '🥘', label: 'Fine Dining', query: 'Fine Dining' },
            { emoji: '🍰', label: 'Bakery & Pastri', query: 'Bakery' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '👗', label: 'Fashion Muslim', query: 'Fashion Muslim' },
            { emoji: '💊', label: 'Kesehatan & Herbal', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'singapura': {
        emoji: '🇸🇬', name: 'Singapura', color: '#DC2626',
        desc: 'Kuliner halal premium dengan standar MUIS yang ketat.',
        tips: 'Restoran bersertifikat MUIS bisa ditemukan di hampir semua food court.',
        certBody: 'MUIS',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
            { emoji: '🍛', label: 'Hawker Centre', query: 'Street Food' },
            { emoji: '🥘', label: 'Fine Dining', query: 'Fine Dining' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Kesehatan & Kosmetik', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'thailand': {
        emoji: '🇹🇭', name: 'Thailand', color: '#1D4ED8',
        desc: 'Street food halal yang unik, terutama di area Soi Arab Bangkok.',
        tips: 'Cari restoran dengan tanda "Halal" atau logo CICOT di area Muslim-friendly.',
        certBody: 'CICOT',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Produk Herbal', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'jepang': {
        emoji: '🇯🇵', name: 'Jepang', color: '#DC2626',
        desc: 'Ramen, sushi, dan wagyu halal dengan sertifikasi JHA dan Muslim Friendly.',
        tips: 'Gunakan app "Halal Gourmet Japan" atau cari logo Muslim Friendly di restoran.',
        certBody: 'JHA',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍜', label: 'Ramen Halal', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan Jepang', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Kosmetik Jepang', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'korea': {
        emoji: '🇰🇷', name: 'Korea Selatan', color: '#1D4ED8',
        desc: 'K-Food halal trending: tteokbokki, fried chicken, dan Korean BBQ halal.',
        tips: 'Cari restoran di area Itaewon Seoul yang banyak pilihan halal.',
        certBody: 'KMF',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍛', label: 'Korean BBQ Halal', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe Korea', query: 'Cafe' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'K-Food', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💄', label: 'K-Beauty Halal', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'turki': {
        emoji: '🇹🇷', name: 'Turki', color: '#DC2626',
        desc: 'Kebab, baklava, dan kuliner Ottoman yang hampir semuanya halal.',
        tips: 'Mayoritas restoran di Turki halal. Hati-hati dengan restoran yang menyajikan alkohol.',
        certBody: 'GİMDES / TSE',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🥙', label: 'Kebab & Döner', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe & Çay', query: 'Cafe' },
            { emoji: '🍰', label: 'Pastane', query: 'Bakery' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan Turki', query: 'Makanan & Minuman (F&B)' },
            { emoji: '👗', label: 'Fashion Muslim', query: 'Fashion Muslim' },
        ],
    },
    'uae': {
        emoji: '🇦🇪', name: 'UAE', color: '#047857',
        desc: 'Dubai & Abu Dhabi — surga kuliner halal internasional.',
        tips: 'Hampir semua restoran di UAE halal. Cari label ESMA untuk produk.',
        certBody: 'ESMA',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🥘', label: 'Fine Dining', query: 'Fine Dining' },
            { emoji: '☕', label: 'Cafe Premium', query: 'Cafe' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Kesehatan & Kosmetik', query: 'Kesehatan, Herbal & Kosmetik' },
            { emoji: '👗', label: 'Fashion Muslim', query: 'Fashion Muslim' },
        ],
    },
    'arab-saudi': {
        emoji: '🇸🇦', name: 'Arab Saudi', color: '#047857',
        desc: 'Tanah suci umat Islam dengan kuliner Arab autentik.',
        tips: 'Semua restoran dan produk di Arab Saudi wajib halal.',
        certBody: 'SFDA',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🥘', label: 'Kuliner Arab', query: 'Fine Dining' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan Arab', query: 'Makanan & Minuman (F&B)' },
            { emoji: '🕌', label: 'Perlengkapan Ibadah', query: 'Peralatan Rumah Tangga & Gaya Hidup' },
        ],
    },
    'mesir': {
        emoji: '🇪🇬', name: 'Mesir', color: '#B45309',
        desc: 'Kuliner Timur Tengah autentik: koshari, falafel, dan shawarma.',
        tips: 'Mayoritas restoran di Mesir halal. Cari restoran lokal untuk pengalaman terbaik.',
        certBody: 'EOS',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan Mesir', query: 'Makanan & Minuman (F&B)' },
        ],
    },
    'india': {
        emoji: '🇮🇳', name: 'India', color: '#EA580C',
        desc: 'Mughlai, biryani, dan kuliner halal dari berbagai daerah India.',
        tips: 'Cari restoran bertanda "Halal" atau di area Muslim seperti Old Delhi.',
        certBody: 'FSSAI / Jamiat',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
            { emoji: '🥘', label: 'Mughlai Dining', query: 'Fine Dining' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan India', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Herbal & Ayurveda', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'uk': {
        emoji: '🇬🇧', name: 'Inggris', color: '#1D4ED8',
        desc: 'London memiliki salah satu scene halal food terbesar di Eropa.',
        tips: 'Cari sertifikasi HFA atau HMC pada restoran dan produk.',
        certBody: 'HFA / HMC',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
            { emoji: '🍛', label: 'Takeaway', query: 'Street Food' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Kosmetik Halal', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
    'australia': {
        emoji: '🇦🇺', name: 'Australia', color: '#1D4ED8',
        desc: 'Multicultural halal dining dari Sydney hingga Melbourne.',
        tips: 'Cari sertifikasi AFIC di restoran. Banyak halal options di Lakemba dan Auburn.',
        certBody: 'AFIC',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
            { emoji: '🍛', label: 'Street Food', query: 'Street Food' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
        ],
    },
    'amerika': {
        emoji: '🇺🇸', name: 'Amerika Serikat', color: '#1D4ED8',
        desc: 'Halal food movement yang terus berkembang di kota-kota besar.',
        tips: 'Cari HFA atau ISNA certification. Banyak pilihan di NYC, Chicago, Detroit.',
        certBody: 'ISNA / HFA',
        merchantCategories: [
            { emoji: '🍽', label: 'Restaurant', query: 'Restaurant' },
            { emoji: '🍛', label: 'Food Truck', query: 'Street Food' },
            { emoji: '☕', label: 'Cafe', query: 'Cafe' },
        ],
        productCategories: [
            { emoji: '🍜', label: 'Makanan & Minuman', query: 'Makanan & Minuman (F&B)' },
            { emoji: '💊', label: 'Suplemen & Kosmetik', query: 'Kesehatan, Herbal & Kosmetik' },
        ],
    },
};

// Keywords to match addresses by country
const countryKeywords = {
    'indonesia': ['indonesia', 'jakarta', 'bandung', 'surabaya', 'yogyakarta', 'bali', 'medan', 'semarang', 'makassar', 'denpasar', 'malang', 'solo', 'bogor', 'depok', 'tangerang', 'bekasi', 'palembang'],
    'malaysia': ['malaysia', 'kuala lumpur', 'penang', 'johor', 'melaka', 'kota kinabalu', 'langkawi', 'putrajaya', 'selangor', 'sabah', 'sarawak'],
    'singapura': ['singapore', 'singapura'],
    'thailand': ['thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya'],
    'jepang': ['japan', 'jepang', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya'],
    'korea': ['korea', 'seoul', 'busan', 'incheon', 'daegu'],
    'turki': ['turkey', 'turki', 'istanbul', 'ankara', 'antalya'],
    'uae': ['uae', 'dubai', 'abu dhabi', 'sharjah', 'emirates'],
    'arab-saudi': ['saudi', 'arabia', 'riyadh', 'jeddah', 'mecca', 'medina', 'makkah', 'madinah'],
    'mesir': ['egypt', 'mesir', 'cairo', 'alexandria'],
    'india': ['india', 'mumbai', 'delhi', 'hyderabad', 'bangalore', 'chennai', 'kolkata'],
    'uk': ['united kingdom', 'england', 'london', 'manchester', 'birmingham', 'inggris'],
    'australia': ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    'amerika': ['united states', 'usa', 'new york', 'los angeles', 'chicago', 'houston', 'california', 'texas', 'florida'],
};

function matchesCountry(address, slug) {
    if (!address) return false;
    const lower = address.toLowerCase();
    const keywords = countryKeywords[slug] || [];
    if (!keywords.some(kw => lower.includes(kw))) return false;
    // Exclusive check: make sure it doesn't match a more specific country first
    // e.g. 'Bali, Indonesia' should not also match 'india' because 'bali' is only in indonesia keywords
    return true;
}

export default function CountryDetailPage() {
    const params = useParams();
    const country = countryData[params.id];
    const [merchants, setMerchants] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!country) { setLoading(false); return; }
            try {
                const placesSnap = await getDocs(query(collection(db, 'places'), where('status', '==', 'approved')));
                const allPlaces = placesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const countryPlaces = allPlaces.filter(p => matchesCountry(p.address, params.id));
                setMerchants(countryPlaces);
            } catch (e) { console.warn('Error loading merchants:', e); }
            try {
                const productsSnap = await getDocs(query(collection(db, 'products'), where('status', '==', 'active')));
                const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const countryProducts = allProducts.filter(p => {
                    if (p.halalCountry) return p.halalCountry.toLowerCase() === country.name.toLowerCase();
                    // Products without halalCountry default to Indonesia
                    if (params.id === 'indonesia') return true;
                    return false;
                });
                setProducts(countryProducts);
            } catch (e) { console.warn('Error loading products:', e); }
            setLoading(false);
        }
        loadData();
    }, [params.id]);

    if (!country) {
        return (
            <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🌍</div>
                <h2>Negara tidak ditemukan</h2>
                <Link href="/travel" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>← Kembali</Link>
            </div>
        );
    }

    const color = country.color;
    const countryParam = encodeURIComponent(country.name);

    return (
        <div className="page container" style={{ paddingTop: 0, paddingBottom: '96px' }}>
            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                margin: '0 calc(-1 * var(--space-md))', padding: 'var(--space-xl) var(--space-md)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-20px', fontSize: '120px', opacity: 0.1 }}>{country.emoji}</div>

                <Link href="/travel" style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none', color: 'var(--white)',
                    marginBottom: 'var(--space-lg)',
                }}>←</Link>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '48px' }}>{country.emoji}</span>
                    <h1 style={{ color: 'var(--white)', fontSize: '24px', margin: 'var(--space-sm) 0' }}>{country.name}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.6 }}>{country.desc}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '22px' }}>📜</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--text-secondary)' }}>Sertifikasi</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{country.certBody}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '22px' }}>🏪</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--text-secondary)' }}>Merchant</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{loading ? '...' : `${merchants.length} terdaftar`}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '22px' }}>🛍</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--text-secondary)' }}>Produk</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{loading ? '...' : `${products.length} produk`}</div>
                </div>
            </div>

            {/* Tips */}
            {country.tips && (
                <div style={{
                    background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)', marginBottom: 'var(--space-xl)',
                    border: '1px solid #D1FAE5',
                }}>
                    <h3 style={{ fontSize: '14px', marginBottom: 'var(--space-xs)' }}>💡 Tips Halal di {country.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{country.tips}</p>
                </div>
            )}

            {/* Merchant Categories */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>🍽 Kategori Merchant</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Temukan restoran & tempat makan halal di {country.name}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                    {country.merchantCategories.map((cat, i) => (
                        <Link key={i} href={`/search?category=${encodeURIComponent(cat.query)}&country=${countryParam}`} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                            padding: 'var(--space-md) var(--space-sm)', background: 'var(--white)',
                            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
                            textDecoration: 'none', color: 'inherit', gap: '6px',
                            border: '1px solid var(--border)', transition: 'transform 0.15s, box-shadow 0.15s',
                        }}>
                            <span style={{ fontSize: '28px' }}>{cat.emoji}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{cat.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Merchant List */}
            {!loading && merchants.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>🏪 Merchant di {country.name}</h2>
                        <Link href={`/search?country=${countryParam}`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--halalqu-green)' }}>
                            Lihat Semua →
                        </Link>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)' }}>
                        {merchants.slice(0, 8).map(m => (
                            <Link key={m.id} href={`/restaurant/${m.id}`} style={{
                                flexShrink: 0, width: '160px', background: 'var(--white)',
                                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                                textDecoration: 'none', color: 'inherit',
                            }}>
                                <div style={{ width: '100%', height: '100px', background: '#f1f5f9' }}>
                                    {(m.imageUrl || (m.images && m.images[0])) ? (
                                        <img src={m.imageUrl || m.images[0]} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#cbd5e1' }}>🏪</div>
                                    )}
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.category || 'Restoran'}</div>
                                    {m.certBody && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>✅ {m.certBody.toUpperCase()}</div>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Categories */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>🛍 Kategori Produk</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Produk halal bersertifikat {country.certBody}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                    {country.productCategories.map((cat, i) => (
                        <Link key={i} href={`/product/category?name=${encodeURIComponent(cat.query)}`} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                            padding: 'var(--space-md)', background: 'var(--white)',
                            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
                            textDecoration: 'none', color: 'inherit',
                            border: '1px solid var(--border)', transition: 'transform 0.15s',
                        }}>
                            <span style={{ fontSize: '24px', flexShrink: 0 }}>{cat.emoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>{cat.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Product List */}
            {!loading && products.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}>📦 Produk dari {country.name}</h2>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)' }}>
                        {products.slice(0, 8).map(p => (
                            <Link key={p.id} href={`/product/${p.id}`} style={{
                                flexShrink: 0, width: '140px', background: 'var(--white)',
                                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                                textDecoration: 'none', color: 'inherit',
                            }}>
                                <div style={{ width: '100%', height: '100px', background: '#f1f5f9' }}>
                                    {(p.images && p.images[0]) ? (
                                        <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#cbd5e1' }}>📦</div>
                                    )}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                    <p>⏳ Memuat data merchant & produk...</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && merchants.length === 0 && products.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>🔍</div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Belum ada merchant & produk dari {country.name} saat ini.</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Jadi yang pertama menambahkan!</p>
                </div>
            )}

            {/* Browse All */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <Link href={`/search?country=${countryParam}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                    🔍 Semua Merchant {country.name}
                </Link>
                <Link href="/product" className="btn" style={{
                    flex: 1, textAlign: 'center', textDecoration: 'none',
                    background: 'var(--white)', border: '1.5px solid var(--border)',
                }}>
                    🛍 Katalog Produk
                </Link>
            </div>
        </div>
    );
}
