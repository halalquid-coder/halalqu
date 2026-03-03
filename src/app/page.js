'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from './context/UserContext';
import { requestNotificationPermission, db } from './lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [places, setPlaces] = useState([]);
  const notifRef = useRef(null);

  const { user } = useUser();
  const firstName = user.isLoggedIn && user.name ? user.name.split(' ')[0] : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real places for the map
  useEffect(() => {
    async function loadPlaces() {
      try {
        const q = query(collection(db, 'places'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const val = doc.data();
          return {
            id: doc.id,
            name: val.name,
            // generate random coordinates around Jakarta for MVP testing if missing
            lat: val.lat || (-6.2088 + (Math.random() - 0.5) * 0.1),
            lng: val.lng || (106.8456 + (Math.random() - 0.5) * 0.1),
            badge: val.certBody ? '✅ Certified' : '🕌 Muslim Owned',
            emoji: '🍽️',
            ...val
          };
        });
        setPlaces(data);
      } catch (e) {
        console.error("Failed to load places for map:", e);
      }
    }
    loadPlaces();
  }, []);

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Promo Spesial!', desc: 'Diskon 20% di resto favoritmu', time: '1 jam lalu', unread: true },
    { id: 2, title: 'Review disetujui', desc: 'Review kamu untuk Kebab Istanbul telah tayang', time: '5 jam lalu', unread: true },
    { id: 3, title: 'Tempat baru', desc: 'Ada 3 resto halal baru di dekatmu', time: '1 hari lalu', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  const handlePushPermission = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      alert('Push notifications diaktifkan! 🎉');
      // TODO: Save token to user profile in Firestore
    } else {
      alert('Gagal mengaktifkan notifikasi. Pastikan browser mengizinkan.');
    }
  };

  return (
    <div className="page container">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <p className={styles.greeting}>
              Assalamualaikum{firstName ? `, ${firstName}` : ''} 👋
            </p>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', backdropFilter: 'blur(8px)',
                  color: 'white', fontSize: '18px'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    background: 'var(--danger)', color: 'white',
                    fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--halalqu-green)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: 'white', borderRadius: 'var(--radius-md)', width: '280px',
                  boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ padding: '12px var(--space-md)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--charcoal)' }}>Notifikasi</h3>
                    <span style={{ fontSize: '12px', color: 'var(--halalqu-green)', cursor: 'pointer' }}>Tandai dibaca</span>
                  </div>

                  {/* Push Notification Promo */}
                  {!fcmToken && typeof window !== 'undefined' && Notification.permission !== 'granted' && (
                    <div style={{ padding: '12px var(--space-md)', background: '#FFF8E7', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px' }}>🔔</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '12px', margin: '0 0 2px', color: '#B45309' }}>Aktifkan Notifikasi</h4>
                        <p style={{ fontSize: '11px', color: '#B45309', margin: 0, opacity: 0.8 }}>Dapatkan info promo & status review</p>
                      </div>
                      <button onClick={handlePushPermission} style={{
                        padding: '6px 10px', background: '#D4920A', color: 'white',
                        border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}>Aktifkan</button>
                    </div>
                  )}

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '12px var(--space-md)',
                        borderBottom: '1px solid var(--border)',
                        background: n.unread ? 'var(--halalqu-green-light)' : 'white',
                        cursor: 'pointer', display: 'flex', gap: '12px'
                      }}>
                        <div style={{ fontSize: '16px', marginTop: '2px' }}>{n.id === 1 ? '🎉' : n.id === 2 ? '✅' : '📍'}</div>
                        <div>
                          <h4 style={{ fontSize: '13px', margin: '0 0 4px', color: 'var(--charcoal)' }}>{n.title}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>{n.desc}</p>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px', textAlign: 'center', background: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--halalqu-green)', fontWeight: 600, cursor: 'pointer' }}>Lihat Semua</span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
        <HalalMap restaurants={places} />
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
