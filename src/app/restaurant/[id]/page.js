'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './detail.module.css';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [resto, setResto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        async function fetchPlace() {
            if (!params?.id) return;
            try {
                const docRef = doc(db, 'places', params.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setResto({
                        id: docSnap.id,
                        name: data.name || 'Restoran',
                        emoji: '🍽️',
                        rating: data.rating || 0,
                        reviews: data.reviewCount || 0,
                        badge: data.certBody ? 'certified' : 'muslim-owned',
                        badgeLabel: data.certBody ? '✅ Certified Halal' : '🕌 Muslim Owned',
                        category: data.category || 'Restoran',
                        address: data.address || 'Alamat tidak tersedia',
                        hours: data.operatingHours || 'Informasi jam buka tidak tersedia',
                        isOpen: true,
                        lastChecked: data.certDate ? new Date(data.certDate).toLocaleDateString() : 'Baru saja',
                        description: data.description || 'Restoran halal pilihan.',
                        certBody: data.certBody || 'Klaim Mandiri',
                        certExpiry: data.certExpiry || '-',
                        menu: [],
                        reviewsList: []
                    });
                }
            } catch (error) {
                console.error("Error fetching document:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlace();
    }, [params?.id]);

    if (loading) {
        return <div className="page container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', color: 'var(--white)' }}>Memuat data...</div>;
    }

    if (!resto) {
        return (
            <div className="page container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', color: 'var(--white)' }}>
                <h2>Restoran tidak ditemukan.</h2>
                <button onClick={() => router.back()} className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Kembali</button>
            </div>
        );
    }

    return (
        <div className={`page container ${styles.detailPage}`}>
            {/* Hero */}
            <div className={styles.heroImage}>
                <div className={styles.heroOverlay}>
                    <button onClick={() => router.back()} className={styles.heroBtn}>←</button>
                    <div className={styles.heroActions}>
                        <button
                            className={styles.heroBtn}
                            onClick={() => setIsBookmarked(!isBookmarked)}
                            style={{ color: isBookmarked ? 'var(--danger)' : 'inherit' }}
                        >
                            {isBookmarked ? '❤️' : '🤍'}
                        </button>
                        <button className={styles.heroBtn}>📤</button>
                    </div>
                </div>
                {resto.emoji}
            </div>

            {/* Info */}
            <section className={styles.infoSection}>
                <h1 className={styles.restoName}>{resto.name}</h1>

                <div className={styles.badgeRow}>
                    <span className={`badge badge-${resto.badge}`}>{resto.badgeLabel}</span>
                    <span className="stars">⭐ {resto.rating} ({resto.reviews} review)</span>
                </div>

                <div className={styles.metaRow}>
                    <span>📍 {resto.address}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={resto.isOpen ? styles.statusOpen : styles.statusClosed}>
                        🕐 {resto.hours}
                    </span>
                </div>

                <div className="trust-banner" style={{ marginTop: 'var(--space-md)' }}>
                    📅 Last Checked: {resto.lastChecked}
                </div>
            </section>

            {/* Action Buttons */}
            <div className={styles.actionRow}>
                <button className={`${styles.actionBtn} ${styles.actionPrimary}`}>
                    🗺 Get Directions
                </button>
                <button className={`${styles.actionBtn} ${styles.actionSecondary}`}>
                    📞 Telepon
                </button>
            </div>

            {/* About */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📜 Tentang</h2>
                <p className={styles.description}>{resto.description}</p>
            </section>

            {/* Menu */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🍽 Menu Andalan</h2>
                <div className={styles.menuScroll}>
                    {resto.menu.map((item, i) => (
                        <div key={i} className={styles.menuCard}>
                            <div className={styles.menuImage}>{item.emoji}</div>
                            <div className={styles.menuInfo}>
                                <div className={styles.menuName}>{item.name}</div>
                                <div className={styles.menuPrice}>{item.price}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Certificate */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📄 Sertifikat Halal</h2>
                <div className={styles.certCard}>
                    <span className={styles.certIcon}>🏅</span>
                    <div className={styles.certInfo}>
                        <h4>Sertifikat Halal Resmi</h4>
                        <p>Dikeluarkan oleh: {resto.certBody}</p>
                        <p>Berlaku s/d: {resto.certExpiry}</p>
                    </div>
                </div>
            </section>

            {/* Reviews */}
            <section className={styles.section}>
                <div className="section-header">
                    <h2 className={styles.sectionTitle}>💬 Review Komunitas</h2>
                    <span className="section-link">{resto.reviews} review</span>
                </div>

                {resto.reviewsList.map((review, i) => (
                    <div key={i} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <div className={styles.reviewAvatar}>{review.avatar}</div>
                            <div>
                                <div className={styles.reviewName}>{review.name}</div>
                                <div className={styles.reviewDate}>{review.date}</div>
                            </div>
                            <div className={styles.reviewStars}>
                                {'⭐'.repeat(review.rating)}
                            </div>
                        </div>
                        <p className={styles.reviewText}>{review.text}</p>
                        <div className={styles.reviewTags}>
                            <span className={`${styles.reviewTag} ${styles.tagHalal}`}>{review.halalTag}</span>
                            <span className={`${styles.reviewTag} ${styles.tagRasa}`}>
                                Rasa: {'⭐'.repeat(review.ratingRasa)}
                            </span>
                        </div>
                    </div>
                ))}

                <Link href={`/restaurant/${params.id}/review`} className="btn btn-outline btn-full">
                    ✏️ Tulis Review
                </Link>
            </section>
        </div>
    );
}
