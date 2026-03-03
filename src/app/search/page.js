'use client';
import Link from 'next/link';
import styles from './search.module.css';
import { useState } from 'react';

const recentSearches = [];

const popularCities = [
    { emoji: '🇮🇩', name: 'Jakarta', count: 342 },
    { emoji: '🇲🇾', name: 'Kuala Lumpur', count: 215 },
    { emoji: '🇹🇷', name: 'Istanbul', count: 187 },
    { emoji: '🇯🇵', name: 'Tokyo', count: 89 },
    { emoji: '🇬🇧', name: 'London', count: 156 },
    { emoji: '🇦🇪', name: 'Dubai', count: 278 },
];

const halalTypes = ['✅ Certified Halal', '🕌 Muslim Owned', '🥗 Halal Ingredients'];
const categories = ['🍽 Semua', '☕ Cafe', '🍛 Street Food', '🥘 Fine Dining', '🍰 Bakery', '🍕 Western'];
const priceRanges = ['$ Murah', '$$ Sedang', '$$$ Mahal'];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [distance, setDistance] = useState(10);
    const [activeHalal, setActiveHalal] = useState(null);
    const [activeCategory, setActiveCategory] = useState(0);
    const [activePrice, setActivePrice] = useState(null);
    const [showFilter, setShowFilter] = useState(false);

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
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
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
                                    <button
                                        key={i}
                                        className={`chip ${activeHalal === i ? 'active' : ''}`}
                                        onClick={() => setActiveHalal(activeHalal === i ? null : i)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Kategori</div>
                            <div className={styles.filterGrid}>
                                {categories.map((cat, i) => (
                                    <button
                                        key={i}
                                        className={`chip ${activeCategory === i ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(i)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Jarak Maksimum</div>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className={styles.rangeSlider}
                            />
                            <div className={styles.rangeValue}>{distance} km</div>
                        </div>

                        <div className={styles.filterGroup}>
                            <div className={styles.filterLabel}>Kisaran Harga</div>
                            <div className={styles.filterGrid}>
                                {priceRanges.map((price, i) => (
                                    <button
                                        key={i}
                                        className={`chip ${activePrice === i ? 'active' : ''}`}
                                        onClick={() => setActivePrice(activePrice === i ? null : i)}
                                    >
                                        {price}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary btn-full" style={{ marginTop: 'var(--space-md)' }}
                            onClick={() => setShowFilter(false)}>
                            🔍 Terapkan Filter
                        </button>
                    </>
                )}
            </div>

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
                <section className={styles.recentSection}>
                    <div className={styles.filterTitle}>Pencarian Terakhir</div>
                    {recentSearches.map((item, i) => (
                        <div key={i} className={styles.recentItem}>
                            <div className={styles.recentIcon}>{item.icon}</div>
                            <div className={styles.recentText}>
                                <div className={styles.recentName}>{item.name}</div>
                                <div className={styles.recentMeta}>{item.meta}</div>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>↗</span>
                        </div>
                    ))}
                </section>
            )}

            {/* Popular Cities */}
            <section className={styles.popularSection}>
                <div className={styles.filterTitle}>Kota Populer</div>
                <div className={styles.cityGrid}>
                    {popularCities.map((city, i) => (
                        <Link key={i} href={`/travel/${i + 1}`} className={styles.cityCard}>
                            <span className={styles.cityEmoji}>{city.emoji}</span>
                            <div>
                                <div className={styles.cityName}>{city.name}</div>
                                <div className={styles.cityCount}>{city.count} tempat halal</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
