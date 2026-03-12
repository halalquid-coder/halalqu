'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { matchesCountry, getCountrySlugFromName } from '../../../lib/country';

const countryData = {
    'indonesia': { name: 'Indonesia', emoji: '🇮🇩' },
    'malaysia': { name: 'Malaysia', emoji: '🇲🇾' },
    'singapura': { name: 'Singapura', emoji: '🇸🇬' },
    'thailand': { name: 'Thailand', emoji: '🇹🇭' },
    'jepang': { name: 'Jepang', emoji: '🇯🇵' },
    'korea': { name: 'Korea Selatan', emoji: '🇰🇷' },
    'turki': { name: 'Turki', emoji: '🇹🇷' },
    'uae': { name: 'Uni Emirat Arab', emoji: '🇦🇪' },
    'arab-saudi': { name: 'Arab Saudi', emoji: '🇸🇦' },
    'mesir': { name: 'Mesir', emoji: '🇪🇬' },
    'india': { name: 'India', emoji: '🇮🇳' },
    'uk': { name: 'Inggris', emoji: '🇬🇧' },
    'australia': { name: 'Australia', emoji: '🇦🇺' },
    'amerika': { name: 'Amerika Serikat', emoji: '🇺🇸' },
};

export default function CountryMerchantsPage() {
    const params = useParams();
    const router = useRouter();
    const country = countryData[params.id];
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!country) { setLoading(false); return; }
            try {
                const placesSnap = await getDocs(query(collection(db, 'places'), where('status', '==', 'approved')));
                const allPlaces = placesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const countryPlaces = allPlaces.filter(p => matchesCountry(p.address, params.id));
                setMerchants(countryPlaces);
            } catch (e) {
                console.warn('Error loading merchants:', e);
            }
            setLoading(false);
        }
        loadData();
    }, [country, params.id]);

    if (!country) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <h2>Negara tidak ditemukan</h2>
                <Link href="/travel" style={{ color: 'var(--halalqu-green)' }}>Kembali ke Travel</Link>
            </div>
        );
    }

    return (
        <div className="page pb-24" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: 'var(--white)'
                    }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: '18px', margin: 0 }}>
                    {country.emoji} Merchant di {country.name}
                </h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : merchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--white)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Belum ada merchant terdaftar di negara ini.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                    {merchants.map(m => (
                        <Link key={m.id} href={`/restaurant/${m.id}`} style={{
                            background: 'var(--white)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            textDecoration: 'none',
                            color: 'inherit',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ height: '120px', background: 'var(--halalqu-green-light)', position: 'relative' }}>
                                {m.imageUrl || (m.photos && m.photos[0]) || (m.images && m.images[0]) ? (
                                    <img src={m.imageUrl || (m.photos && m.photos[0]) || (m.images && m.images[0])}
                                         alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                                        {m.emoji || '🍽️'}
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', top: '8px', left: '8px',
                                    background: 'var(--white)', padding: '2px 6px',
                                    borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    ⭐ {m.rating || '0.0'}
                                </div>
                            </div>
                            <div style={{ padding: '12px' }}>
                                <h3 style={{ fontSize: '14px', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.category || 'Restoran'}</span>
                                </div>
                                <span className={`badge badge-${m.badge || (m.certBody ? 'certified' : 'muslim-owned')}`} style={{ fontSize: '10px' }}>
                                    {m.badgeLabel || (m.certBody ? 'Certified' : 'Muslim Owned')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
