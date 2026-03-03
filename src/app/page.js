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

const categories = [
  { emoji: '🍛', label: 'Street Food' },
  { emoji: '☕', label: 'Cafe' },
  { emoji: '🥘', label: 'Fine Dining' },
  { emoji: '🍰', label: 'Bakery' },
  { emoji: '🦐', label: 'Seafood' },
  { emoji: '🍕', label: 'Western' },
  { emoji: '🍜', label: 'Asian' },
  { emoji: '🧁', label: 'Dessert' },
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
            lat: val.lat || (-6.2088 + (Math.random() - 0.5) * 0.1),
            lng: val.lng || (106.8456 + (Math.random() - 0.5) * 0.1),
            badge: val.certBody ? 'certified' : 'muslim-owned',
            badgeLabel: val.certBody ? '✅ Certified' : '🕌 Muslim Owned',
            emoji: '🍽️',
            rating: val.rating || 0,
            reviews: val.reviewCount || 0,
            distance: '~ km',
            category: val.category || 'Restoran',
            isPremium: val.isPremium || false,
            promoDiscount: val.promoDiscount || null,
            createdAt: val.createdAt || null,
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

  // Derived data for monetization sections
  const premiumPlaces = places.filter(p => p.isPremium);
  const promoPlaces = places.filter(p => p.promoDiscount);
  const topRated = [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const newPlaces = [...places].sort((a, b) => {
    const da = a.createdAt?.seconds || 0;
    const db2 = b.createdAt?.seconds || 0;
    return db2 - da;
  }).slice(0, 5);

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

      {/* ═══════════════════════════════════════════ */}
      {/* 🏷️ SECTION 1: Kategori Kuliner */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.categorySection}>
        <h2 className="section-title">🏷️ Kategori Kuliner</h2>
        <div className={styles.categoryGrid}>
          {categories.map((cat, i) => (
            <Link
              key={i}
              href={`/search?category=${encodeURIComponent(cat.label)}`}
              className={styles.categoryItem}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={styles.categoryIcon}>{cat.emoji}</div>
              <span className={styles.categoryLabel}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🔥 SECTION 2: Promo & Diskon (Sponsored) */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.promoSection}>
        <div className="section-header">
          <h2 className="section-title">🔥 Promo & Diskon</h2>
          <Link href="/search?promo=true" className="section-link">Semua Promo →</Link>
        </div>

        {promoPlaces.length > 0 ? (
          <div className={styles.promoScroll}>
            {promoPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.promoCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.promoEmoji}>{place.emoji || '🍽️'}</div>
                <div className={styles.promoBadge}>🔥 {place.promoDiscount}% OFF</div>
                <div className={styles.promoInfo}>
                  <h3>{place.name}</h3>
                  <p>⭐ {place.rating} · {place.category}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.promoEmptyBanner}>
            <div className={styles.promoEmptyIcon}>🎁</div>
            <div>
              <h3>Promo Segera Hadir!</h3>
              <p>Dapatkan diskon eksklusif dari restoran halal pilihan</p>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ⭐ SECTION 3: Rekomendasi Pilihan (Premium) */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.sponsoredSection}>
        <div className="section-header">
          <h2 className="section-title">⭐ Rekomendasi Pilihan</h2>
          <Link href="/search?featured=true" className="section-link">Lihat Semua →</Link>
        </div>

        {premiumPlaces.length > 0 ? (
          <div className={styles.sponsoredScroll}>
            {premiumPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.sponsoredCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.sponsoredBadge}>⭐ Pilihan Halalqu</div>
                <div className={styles.sponsoredEmoji}>{place.emoji || '🍽️'}</div>
                <h3 className={styles.sponsoredName}>{place.name}</h3>
                <div className={styles.sponsoredMeta}>
                  <span>⭐ {place.rating}</span>
                  <span className={`badge badge-${place.badge}`} style={{ fontSize: '10px' }}>{place.badgeLabel}</span>
                </div>
                <span className={styles.sponsoredCategory}>{place.category}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.sponsoredEmptyBanner}>
            <div style={{ fontSize: '36px' }}>⭐</div>
            <div>
              <h3>Ingin restoran Anda tampil di sini?</h3>
              <p>Daftarkan merchant Anda dan jadi rekomendasi pilihan Halalqu</p>
            </div>
            <Link href="/merchant/register" className={styles.sponsoredCta}>Daftar Merchant →</Link>
          </div>
        )}
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

      {/* ═══════════════════════════════════════════ */}
      {/* 🆕 SECTION 4: Baru Dibuka */}
      {/* ═══════════════════════════════════════════ */}
      {newPlaces.length > 0 && (
        <section className={styles.newSection}>
          <div className="section-header">
            <h2 className="section-title">🆕 Baru Dibuka</h2>
            <Link href="/search?sort=newest" className="section-link">Lihat Semua →</Link>
          </div>
          <div className={styles.newScroll}>
            {newPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.newCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.newBadge}>🆕 Baru</div>
                <div className={styles.newEmoji}>{place.emoji || '🍽️'}</div>
                <h3 className={styles.newName}>{place.name}</h3>
                <span className={styles.newMeta}>
                  <span className={`badge badge-${place.badge}`} style={{ fontSize: '10px' }}>{place.badgeLabel}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* 🏆 SECTION 5: Top Rated */}
      {/* ═══════════════════════════════════════════ */}
      {topRated.length > 0 && (
        <section className={styles.topRatedSection}>
          <div className="section-header">
            <h2 className="section-title">🏆 Top Rated</h2>
            <Link href="/search?sort=rating" className="section-link">Lihat Semua →</Link>
          </div>
          <div className={styles.topRatedList}>
            {topRated.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.topRatedCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.topRatedRank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className={styles.topRatedEmoji}>{place.emoji || '🍽️'}</div>
                <div className={styles.topRatedInfo}>
                  <h3>{place.name}</h3>
                  <div className={styles.topRatedMeta}>
                    <span>⭐ {place.rating}</span>
                    <span>·</span>
                    <span>{place.category}</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Restaurant List — Di Sekitarmu */}
      <section className={styles.restaurantSection}>
        <div className="section-header">
          <h2 className="section-title">Di Sekitarmu</h2>
          <Link href="/search" className="section-link">Lihat Semua →</Link>
        </div>

        {places.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px' }}>Belum ada restoran terdekat.</p>
        ) : (
          <div className={`${styles.restaurantList} stagger`}>
            {places.map((resto, i) => (
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
        )}
      </section>
    </div>
  );
}
