'use client';
import Link from 'next/link';
import styles from './search.module.css';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const popularCities = [
    { emoji: '🇮🇩', name: 'Jakarta' },
    { emoji: '🇲🇾', name: 'Kuala Lumpur' },
    { emoji: '🇹🇷', name: 'Istanbul' },
    { emoji: '🇯🇵', name: 'Tokyo' },
    { emoji: '🇬🇧', name: 'London' },
    { emoji: '🇦🇪', name: 'Dubai' },
];

const halalTypes = ['Certified Halal', 'Muslim Owned', 'Halal Ingredients'];
const categories = ['Semua', 'Cafe', 'Street Food', 'Fine Dining', 'Bakery', 'Western'];
const priceRanges = ['$ Murah', '$$ Sedang', '$$$ Mahal'];

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [distance, setDistance] = useState(10);
    const [activeHalal, setActiveHalal] = useState(null);
    const [activeCategory, setActiveCategory] = useState(0);
    const [activePrice, setActivePrice] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [allPlaces, setAllPlaces] = useState([]);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(!!initialQuery);

    // Load all places once for client-side search
    useEffect(() => {
        async function loadPlaces() {
            try {
                const q = query(collection(db, 'places'));
                const snap = await getDocs(q);
                const data = snap.docs.map(d => {
                    const val = d.data();
                    return {
                        id: d.id,
                        name: val.name || '',
                        address: val.address || '',
                        category: val.category || 'Restoran',
                        badge: val.certBody ? 'certified' : 'muslim-owned',
                        badgeLabel: val.certBody ? '✅ Certified' : '🕌 Muslim Owned',
                        rating: val.rating || 0,
                        reviewCount: val.reviewCount || 0,
                        status: val.status || 'pending',
                    };
                });
                setAllPlaces(data.filter(p => p.status === 'approved'));
            } catch (e) {
                console.error('Failed to load places for search:', e);
            }
        }
        loadPlaces();
    }, []);

    // Search when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const q = searchQuery.toLowerCase();
        const filtered = allPlaces.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
        setResults(filtered);
    }, [searchQuery, allPlaces]);

    return (
        <div className={`page container ${styles.searchPage}`}>
            {/* Search Header */}
            <div className={styles.searchHeader}>
                <Link href="/" className={styles.backBtn}>←</Link>
                <div className={styles.searchInputBox}>
                    <span>🔍</span>
                    <input
                        type="text"
                        placeholder="Cari restoran, menu, atau kota..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            <div className={styles.advancedFilter}>
                <div className={styles.advancedTitle} onClick={() => setShowFilter(!showFilter)}>
                    <h3>⚙️ Filter Pencarian</h3>
                    <span>{showFilter ? '▲' : '▼'}</span>
                </div>

                {showFilter && (
                    <>
                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Jenis Halal</div>
                            <div className={styles.filterGrid}>
                                {halalTypes.map((type, i) => (
                                    <button key={i} className={`chip ${activeHalal === i ? 'active' : ''}`} onClick={() => setActiveHalal(activeHalal === i ? null : i)}>{type}</button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Kategori</div>
                            <div className={styles.filterGrid}>
                                {categories.map((cat, i) => (
                                    <button key={i} className={`chip ${activeCategory === i ? 'active' : ''}`} onClick={() => setActiveCategory(i)}>{cat}</button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Jarak Maksimum</div>
                            <input type="range" min="1" max="50" value={distance} onChange={(e) => setDistance(e.target.value)} className={styles.rangeSlider} />
                            <div className={styles.rangeValue}>{distance} km</div>
                        </div>
                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Kisaran Harga</div>
                            <div className={styles.filterGrid}>
                                {priceRanges.map((price, i) => (
                                    <button key={i} className={`chip ${activePrice === i ? 'active' : ''}`} onClick={() => setActivePrice(activePrice === i ? null : i)}>{price}</button>
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-primary btn-full" style={{ marginTop: 'var(--space-md)' }} onClick={() => setShowFilter(false)}>
                            🔍 Terapkan Filter
                        </button>
                    </>
                )}
            </div>

            {/* Search Results */}
            {isSearching && (
                <section style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className={styles.filterTitle}>Hasil Pencarian ({results.length})</div>
                    {results.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)',
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)', marginTop: 'var(--space-sm)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🧐</div>
                            <h3 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>
                                Restoran tidak ditemukan
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-xl)' }}>
                                Kami belum memiliki data untuk "<b>{searchQuery}</b>". Bantu komunitas dengan menambahkan tempat ini!
                            </p>
                            <Link href="/add-place" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'var(--halalqu-green)', color: 'var(--white)',
                                padding: '12px 24px', borderRadius: 'var(--radius-pill)',
                                textDecoration: 'none', fontWeight: 600, fontSize: '15px'
                            }}>
                                <span>➕</span> Rekomendasikan Tempat
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {results.map(p => (
                                <Link key={p.id} href={`/restaurant/${p.id}`} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                                    textDecoration: 'none', color: 'inherit',
                                }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🍽️</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{p.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <span className={`badge badge-${p.badge}`} style={{ fontSize: '10px', marginRight: '6px' }}>{p.badgeLabel}</span>
                                            ⭐ {p.rating} · {p.category}
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Popular Cities — only show when not searching */}
            {!isSearching && (
                <section className={styles.popularSection}>
                    <div className={styles.filterTitle}>Kota Populer</div>
                    <div className={styles.cityGrid}>
                        {popularCities.map((city, i) => (
                            <div key={i} className={styles.cityCard} onClick={() => setSearchQuery(city.name)} style={{ cursor: 'pointer' }}>
                                <span className={styles.cityEmoji}>{city.emoji}</span>
                                <div>
                                    <div className={styles.cityName}>{city.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
