'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './detail.module.css';
import { useState } from 'react';

const restaurantData = {
    1: {
        name: 'Warung Halal Barokah',
        emoji: '🍛',
        rating: 4.8,
        reviews: 234,
        badge: 'certified',
        badgeLabel: '✅ Certified Halal',
        category: 'Indonesian · Street Food',
        address: 'Jl. Sudirman No. 12, Jakarta Pusat',
        hours: 'Buka · Tutup 22:00',
        isOpen: true,
        lastChecked: '28 Feb 2026',
        description: 'Warung makan khas Indonesia dengan masakan rumahan yang lezat dan dijamin halal. Semua bahan baku dipastikan halal dengan sertifikasi dari MUI. Tempat yang nyaman untuk makan bersama keluarga.',
        certBody: 'MUI / BPJPH',
        certExpiry: 'Des 2026',
        menu: [
            { name: 'Nasi Gudeg', price: 'Rp 35.000', emoji: '🍛' },
            { name: 'Sate Ayam', price: 'Rp 40.000', emoji: '🍢' },
            { name: 'Soto Ayam', price: 'Rp 30.000', emoji: '🍲' },
            { name: 'Es Teh Manis', price: 'Rp 8.000', emoji: '🧊' },
        ],
        reviewsList: [
            {
                name: 'Ahmad Fauzi',
                avatar: '👤',
                rating: 5,
                date: '25 Feb 2026',
                text: 'Dagingnya dijamin halal, bisa lihat sertifikat langsung di kasir. Rasa masakannya seperti masakan rumah, enak banget!',
                halalTag: '✅ Yakin Halal',
                ratingRasa: 5,
            },
            {
                name: 'Siti Nurhaliza',
                avatar: '👩',
                rating: 4,
                date: '20 Feb 2026',
                text: 'Tempatnya bersih dan nyaman. Menu favorit saya soto ayam-nya, kuahnya kaya rempah. Recommended!',
                halalTag: '✅ Yakin Halal',
                ratingRasa: 4,
            },
        ],
    },
};

const defaultResto = {
    name: 'Restoran Halal',
    emoji: '🍽',
    rating: 4.5,
    reviews: 100,
    badge: 'certified',
    badgeLabel: '✅ Certified Halal',
    category: 'Restaurant',
    address: 'Jakarta, Indonesia',
    hours: 'Buka · Tutup 21:00',
    isOpen: true,
    lastChecked: '01 Mar 2026',
    description: 'Restoran halal dengan berbagai menu pilihan. Semua makanan disiapkan dengan memperhatikan standar kehalalan yang ketat.',
    certBody: 'MUI',
    certExpiry: 'Des 2026',
    menu: [
        { name: 'Menu Spesial', price: 'Rp 45.000', emoji: '🍽' },
        { name: 'Paket Hemat', price: 'Rp 30.000', emoji: '🍱' },
    ],
    reviewsList: [
        {
            name: 'User',
            avatar: '👤',
            rating: 4,
            date: '01 Mar 2026',
            text: 'Makanan enak dan terjamin halal.',
            halalTag: '✅ Yakin Halal',
            ratingRasa: 4,
        },
    ],
};

export default function RestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const resto = restaurantData[params.id] || defaultResto;
    const [isBookmarked, setIsBookmarked] = useState(false);

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
