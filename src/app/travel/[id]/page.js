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

export default function CountryDetailPage() {
    const params = useParams();
    const country = countryData[params.id];
    const [merchantCount, setMerchantCount] = useState(0);
    const [productCount, setProductCount] = useState(0);

    useEffect(() => {
        async function loadCounts() {
            try {
                const placesSnap = await getDocs(query(collection(db, 'places'), where('status', '==', 'approved')));
                setMerchantCount(placesSnap.size);
            } catch (e) { console.warn(e); }
            try {
                const productsSnap = await getDocs(query(collection(db, 'products'), where('status', '==', 'active')));
                setProductCount(productsSnap.size);
            } catch (e) { console.warn(e); }
        }
        loadCounts();
    }, []);

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
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{merchantCount} terdaftar</div>
                </div>
                <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '22px' }}>🛍</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--text-secondary)' }}>Produk</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{productCount} produk</div>
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
                        <Link key={i} href={`/search?q=&category=${encodeURIComponent(cat.query)}`} style={{
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

            {/* Browse All */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <Link href="/search" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                    🔍 Cari Semua Merchant
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
