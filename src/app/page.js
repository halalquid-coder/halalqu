'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const HalalMap = dynamic(() => import('./components/HalalMap'), { ssr: false });

const filters = ['Semua', '✅ Certified', '🕌 Muslim Owned', '🥗 Halal Ingredients'];

const restaurants = [
  {
    id: 1,
    name: 'Warung Halal Barokah',
    rating: 4.8,
    reviews: 234,
    distance: '0.8 km',
    category: 'Indonesian · Street Food',
    badge: 'certified',
    badgeLabel: '✅ Certified Halal',
    emoji: '🍛',
    lastChecked: '28 Feb 2026',
  },
  {
    id: 2,
    name: 'Kebab Istanbul',
    rating: 4.5,
    reviews: 128,
    distance: '1.2 km',
    category: 'Turkish · Cafe',
    badge: 'muslim-owned',
    badgeLabel: '🕌 Muslim Owned',
    emoji: '🥙',
    lastChecked: '15 Feb 2026',
  },
  {
    id: 3,
    name: 'Sushi Zen Halal',
    rating: 4.6,
    reviews: 89,
    distance: '2.1 km',
    category: 'Japanese · Fine Dining',
    badge: 'certified',
    badgeLabel: '✅ Certified Halal',
    emoji: '🍱',
    lastChecked: '01 Mar 2026',
  },
  {
    id: 4,
    name: 'Roti Canai Corner',
    rating: 4.3,
    reviews: 67,
    distance: '3.5 km',
    category: 'Malaysian · Street Food',
    badge: 'halal-ingredients',
    badgeLabel: '🥗 Halal Ingredients',
    emoji: '🫓',
    lastChecked: '20 Feb 2026',
  },
];

const travelSpots = [
  { id: 1, name: 'Monas, Jakarta', count: 24, emoji: '🕌', bg: 'linear-gradient(135deg, #2E9B5A 0%, #1a7a3f 100%)' },
  { id: 2, name: 'Menara Eiffel', count: 18, emoji: '🗼', bg: 'linear-gradient(135deg, #3D444B 0%, #1a1a2e 100%)' },
  { id: 3, name: 'Hagia Sophia', count: 32, emoji: '🕌', bg: 'linear-gradient(135deg, #D4920A 0%, #b8780a 100%)' },
  { id: 4, name: 'Tokyo Tower', count: 15, emoji: '🗼', bg: 'linear-gradient(135deg, #E74C3C 0%, #c0392b 100%)' },
];

export default function HomePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <div className="page container">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.greeting}>Assalamualaikum 👋</p>
          <h1 className={styles.heroTitle}>
            Mau makan apa hari ini?
            <span>Temukan makanan halal terdekat yang terpercaya</span>
          </h1>

          <Link href="/search" className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <span className={styles.searchText}>Cari restoran, menu, atau kota...</span>
          </Link>

          <button className={styles.nearbyBtn} onClick={() => router.push('/search')}>
            <span>📍</span>
            Cari di Sekitarku
          </button>
        </div>
      </section>

      {/* Filter Chips */}
      <section className={styles.chipsSection}>
        <div className={styles.chipsRow}>
          {filters.map((filter, i) => (
            <button
              key={i}
              className={`chip ${i === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(i)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Map */}
      <section className={styles.mapSection}>
        <HalalMap />
      </section>

      {/* Restaurant List */}
      <section className={styles.restaurantSection}>
        <div className="section-header">
          <h2 className="section-title">Di Sekitarmu</h2>
          <Link href="/search" className="section-link">Lihat Semua →</Link>
        </div>

        <div className={`${styles.restaurantList} stagger`}>
          {restaurants.map((resto, i) => (
            <Link
              key={resto.id}
              href={`/restaurant/${resto.id}`}
              className={styles.restaurantCard}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={styles.cardImage}>
                {resto.emoji}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardName}>{resto.name}</h3>
                <div className={styles.cardMeta}>
                  <span className={`badge badge-${resto.badge}`}>
                    {resto.badgeLabel}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.cardRating}>
                    <span className="star">⭐</span> {resto.rating}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({resto.reviews})</span>
                  </span>
                  <span className={styles.cardDistance}>📍 {resto.distance}</span>
                </div>
                <span className={styles.cardCategory}>{resto.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Travel Guide */}
      <section className={styles.travelSection}>
        <div className="section-header">
          <h2 className="section-title">🧳 Travel Guide</h2>
          <Link href="/travel" className="section-link">Semua →</Link>
        </div>

        <div className={styles.travelGrid}>
          {travelSpots.map((spot) => (
            <Link
              key={spot.id}
              href={`/travel/${spot.id}`}
              className={styles.travelCard}
            >
              <div className={styles.travelBg} style={{ background: spot.bg }}>
                {spot.emoji}
              </div>
              <div className={styles.travelInfo}>
                <div className={styles.travelTitle}>{spot.name}</div>
                <div className={styles.travelCount}>{spot.count} tempat halal</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
