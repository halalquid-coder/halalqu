'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from './context/UserContext';
import { requestNotificationPermission, db } from './lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { getUserNotifications } from './lib/firestore';

const HalalMap = dynamic(() => import('./components/HalalMap'), { ssr: false });

import ImageSlider from './components/ImageSlider';

const categories = [
  { emoji: '🍽️', label: 'Semua Kategori', path: '/search' },
  { emoji: '🛍️', label: 'Katalog Produk', path: '/product' },
  { emoji: '🛡️', label: 'Certified', path: '/search?category=Certified' },
  { emoji: '🕌', label: 'Muslim Owned', path: '/search?category=Muslim%20Owned' },
];

export default function HomePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [places, setPlaces] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const { user, notificationsEnabled: contextNotif, toggleNotifications } = useUser();
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
            lat: val.lat || null,
            lng: val.lng || null,
            badge: val.certBody ? 'certified' : 'muslim-owned',
            badgeLabel: val.certBody ? 'Certified' : 'Muslim Owned',
            emoji: '🍽️',
            rating: val.rating || 0,
            reviews: val.reviewCount || 0,
            category: val.category || 'Restoran',
            isPremium: val.isPremium || false,
            photo: val.imageUrl || ((val.photos && val.photos.length > 0) ? val.photos[0] : ((val.images && val.images.length > 0) ? val.images[0] : null)),
            promoDiscount: val.promoDiscount || null,
            createdAt: val.createdAt || null,
            ...val
          };
        });

        // Get user location and filter places by distance (< 3km) if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;

            const withDistance = data.map(p => {
              const R = 6371; // Earth radius in km
              const dLat = (p.lat - userLat) * Math.PI / 180;
              const dLng = (p.lng - userLng) * Math.PI / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const dist = R * c;

              return {
                ...p,
                distNum: dist,
                distance: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`
              };
            });

            const nearbyApproved = withDistance
              .filter(p => p.status === 'approved' && p.distNum <= 3)
              .sort((a, b) => a.distNum - b.distNum);

            setPlaces(nearbyApproved);
          }, () => {
            // Fallback if no location
            setPlaces(data.filter(p => p.status === 'approved').map(p => ({ ...p, distance: '~ km' })));
          });
        } else {
          setPlaces(data.filter(p => p.status === 'approved').map(p => ({ ...p, distance: '~ km' })));
        }

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

  // Fetch real notifications from Firestore
  useEffect(() => {
    async function loadNotifications() {
      if (user?.notificationsEnabled === false) return;
      try {
        const data = await getUserNotifications(user.uid || 'guest', user?.role || 'user');
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          desc: n.message,
          time: n.createdAt ? formatTimeAgo(n.createdAt) : 'Baru saja',
          unread: !n.read,
          isGlobal: n.isGlobal || false,
        })));
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
    loadNotifications();
  }, [user.uid, user?.notificationsEnabled]);

  const formatTimeAgo = (ts) => {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handlePushPermission = async () => {
    try {
      // Use in-app notification system (Firestore-based)
      setFcmToken('in-app-enabled');
      if (!contextNotif) {
        await toggleNotifications();
      }
      alert('Notifikasi dalam aplikasi diaktifkan! 🔔\nKamu akan menerima notifikasi di bell icon.');
    } catch (e) {
      console.error('Notification opt-in error:', e);
      setFcmToken('in-app-enabled');
      alert('Notifikasi dalam aplikasi diaktifkan! 🔔');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user.isLoggedIn || !user.uid) return;

    const unreadNotifs = notifications.filter(n => n.unread);
    if (unreadNotifs.length === 0) return;

    // Optimistically update local UI immediately
    setNotifications(notifications.map(n => ({ ...n, unread: false })));

    try {
      const { writeBatch, doc: fbDoc, updateDoc, arrayUnion } = await import('firebase/firestore');

      // Update global reads in user profile array
      const globalIds = unreadNotifs.filter(n => n.isGlobal).map(n => n.id);
      if (globalIds.length > 0) {
        await updateDoc(fbDoc(db, 'users', user.uid), {
          readGlobalNotifications: arrayUnion(...globalIds)
        });
      }

      // Update personal reads directly via batch update
      const personalIds = unreadNotifs.filter(n => !n.isGlobal).map(n => n.id);
      if (personalIds.length > 0) {
        const batch = writeBatch(db);
        personalIds.forEach(id => {
          batch.update(fbDoc(db, 'notifications', id), { read: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error("Gagal menandai notifikasi telah dibaca:", err);
    }
  };

  return (
    <div className="page container">
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background shapes securely wrapped in hidden overflow to prevent mobile horizontal scroll */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
          <div className={styles.heroShape1} />
          <div className={styles.heroShape2} />
        </div>

        <div className={styles.heroContent}>
          {/* Header row: Logo on left, Search & Notif on right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--white)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img src="/icon.svg" alt="Halalqu Icon" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--white)', margin: 0, letterSpacing: '-0.5px' }}>
                Halalqu
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/search" style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(8px)',
                color: 'white', fontSize: '16px', textDecoration: 'none'
              }}>
                🔍
              </Link>

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
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{ border: 'none', background: 'transparent', fontSize: '12px', color: 'var(--halalqu-green)', cursor: 'pointer', padding: 0 }}
                      >
                        Tandai dibaca
                      </button>
                    </div>

                    {/* Push Notification Promo */}
                    {!fcmToken && typeof window !== 'undefined' && Notification.permission !== 'granted' && !contextNotif && (
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
                      {notifications.length === 0 ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                          <p style={{ fontSize: '13px' }}>Belum ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} style={{
                            padding: '12px var(--space-md)',
                            borderBottom: '1px solid var(--border)',
                            background: n.unread ? 'var(--halalqu-green-light)' : 'white',
                            cursor: 'pointer', display: 'flex', gap: '12px'
                          }}>
                            <div style={{ fontSize: '16px', marginTop: '2px' }}>📬</div>
                            <div>
                              <h4 style={{ fontSize: '13px', margin: '0 0 4px', color: 'var(--charcoal)' }}>{n.title}</h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>{n.desc}</p>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ padding: '8px', textAlign: 'center', background: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                      <Link href="/notifications" style={{ fontSize: '12px', color: 'var(--halalqu-green)', fontWeight: 600, textDecoration: 'none' }}>
                        Lihat Semua
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className={styles.greeting} style={{ marginBottom: '8px' }}>
            Assalamualaikum{firstName ? `, ${firstName}` : ''} 👋
          </p>
          <h1 className={styles.heroTitle}>
            Mau makan apa hari ini?
            <span>Temukan makanan halal terdekat yang terpercaya</span>
          </h1>

          <button className={styles.nearbyBtn} onClick={() => {
            router.push(`/search`);
          }}>
            Cari di Sekitarku
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🖼️ SECTION 0: Image Slider (Beranda Promo) */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ padding: '0 16px', marginTop: '32px' }}>
        <ImageSlider />
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🏷️ SECTION 1: Kategori Kuliner */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.categorySection}>
        <div className={styles.categoryGrid}>
          {categories.map((cat, i) => (
            <Link
              key={i}
              href={cat.path || `/search?category=${encodeURIComponent(cat.label)}`}
              className={styles.categoryItem}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {cat.emoji && <div className={styles.categoryIcon}>{cat.emoji}</div>}
              <span className={styles.categoryLabel}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🎉 SECTION 2: Promo & Diskon */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.promoSection}>
        <div className="section-header">
          <h2 className="section-title">Promo & Diskon</h2>
          <Link href="/search?promo=true" className="section-link">Lihat Semua →</Link>
        </div>

        {promoPlaces.length > 0 ? (
          <div className={styles.promoScroll}>
            {promoPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.promoCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.promoEmoji}>{place.emoji || '🍽️'}</div>
                <div className={styles.promoBadge}>Diskon {place.promoDiscount}%</div>
                <div className={styles.promoInfo}>
                  <h3>{place.name}</h3>
                  <p>{place.category}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.promoEmptyBanner}>
            <div className={styles.promoEmptyIcon}>🎁</div>
            <div>
              <h3>Belum ada promo saat ini</h3>
              <p>Nantikan promo menarik dari merchant Makanan Halal di sekitarmu!</p>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ⭐ SECTION 3: Rekomendasi Pilihan (Premium) */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.sponsoredSection}>
        <div className="section-header">
          <h2 className="section-title">Rekomendasi Pilihan</h2>
          <Link href="/search?featured=true" className="section-link">Lihat Semua →</Link>
        </div>

        {premiumPlaces.length > 0 ? (
          <div className={styles.sponsoredScroll}>
            {premiumPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.sponsoredCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.sponsoredBadge}>Pilihan Halalqu</div>
                {place.photo ? (
                  <div style={{
                    width: '100%', height: '100px', borderRadius: 'var(--radius-md)',
                    marginBottom: '8px', overflow: 'hidden', background: 'var(--halalqu-green-light)'
                  }}>
                    <img src={place.photo} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className={styles.sponsoredEmoji}>{place.emoji || '🍽️'}</div>
                )}
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
            <div style={{ fontSize: '36px' }}>🍽️</div>
            <div>
              <h3>Ingin restoran Anda tampil di sini?</h3>
              <p>Daftarkan merchant Anda dan jadi rekomendasi pilihan Halalqu</p>
            </div>
            <Link href="/merchant/register" className={styles.sponsoredCta}>Daftar Merchant →</Link>
          </div>
        )}
      </section>



      {/* Interactive Map */}
      <section className={styles.mapSection}>
        <HalalMap restaurants={places} />
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🆕 SECTIONS: Baru Dibuka & Top Rated */}
      {/* ═══════════════════════════════════════════ */}
      <section className={styles.newSection}>
        <div className="section-header">
          <h2 className="section-title">Baru Buka</h2>
          <Link href="/search?sort=new" className="section-link">Lihat Semua →</Link>
        </div>

        {newPlaces.length > 0 ? (
          <div className={styles.newScroll}>
            {newPlaces.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.newCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.newBadge}>Baru</div>
                {place.photo ? (
                  <div style={{
                    width: '100%', height: '80px', borderRadius: 'var(--radius-md)',
                    marginBottom: '8px', overflow: 'hidden', background: 'var(--halalqu-green-light)'
                  }}>
                    <img src={place.photo} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className={styles.newEmoji}>{place.emoji || '🍽️'}</div>
                )}
                <h3 className={styles.newName}>{place.name}</h3>
                <div className={styles.newMeta}>
                  <span className={`badge badge-${place.badge}`} style={{ fontSize: '9px' }}>{place.badgeLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Belum ada restoran baru minggu ini.</p>
        )}
      </section>

      <section className={styles.topRatedSection}>
        <div className="section-header">
          <h2 className="section-title">Top Rated Sekitarmu</h2>
          <Link href="/search?sort=rating" className="section-link">Lihat Semua →</Link>
        </div>

        {topRated.length > 0 ? (
          <div className={styles.sponsoredScroll}>
            {topRated.map((place, i) => (
              <Link key={place.id} href={`/restaurant/${place.id}`} className={styles.sponsoredCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.topRatedRank}>#{i + 1}</div>
                {place.photo ? (
                  <div style={{
                    width: '100%', height: '80px', borderRadius: 'var(--radius-md)',
                    marginBottom: '8px', overflow: 'hidden', background: 'var(--halalqu-green-light)'
                  }}>
                    <img src={place.photo} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className={styles.sponsoredEmoji}>{place.emoji || '🍽️'}</div>
                )}
                <h3 className={styles.sponsoredName}>{place.name}</h3>
                <div className={styles.sponsoredMeta}>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>⭐ {place.rating}</span>
                  <span className={`badge badge-${place.badge}`} style={{ fontSize: '10px' }}>{place.badgeLabel}</span>
                </div>
                <span className={styles.sponsoredCategory}>{place.category}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Belum ada peringkat untuk saat ini.</p>
        )}
      </section>

      {/* Restaurant List — Di Sekitarmu (Horizontal Scroll) */}
      <section className={styles.restaurantSection}>
        <div className="section-header">
          <h2 className="section-title">Di Sekitarmu</h2>
          <Link href="/search" className="section-link">Lihat Semua →</Link>
        </div>

        {places.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px' }}>Belum ada restoran terdekat.</p>
        ) : (
          <div className={styles.sponsoredScroll}>
            {places.map((resto, i) => (
              <Link
                key={resto.id}
                href={`/restaurant/${resto.id}`}
                className={styles.sponsoredCard}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {resto.photo ? (
                  <div style={{
                    width: '100%', height: '100px', borderRadius: 'var(--radius-md)',
                    marginBottom: '8px', overflow: 'hidden', background: 'var(--halalqu-green-light)'
                  }}>
                    <img src={resto.photo} alt={resto.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className={styles.sponsoredEmoji}>{resto.emoji || '🍽️'}</div>
                )}
                <h3 className={styles.sponsoredName}>{resto.name}</h3>
                <div className={styles.sponsoredMeta}>
                  <span>⭐ {resto.rating}</span>
                  <span className={`badge badge-${resto.badge}`} style={{ fontSize: '10px' }}>{resto.badgeLabel}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--halalqu-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📍</span> {resto.distance || '~ km'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
