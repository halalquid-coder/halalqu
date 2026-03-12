'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './detail.module.css';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getRestaurantReviews, submitReport, toggleBookmark } from '../../lib/firestore';
import { useUser } from '../../context/UserContext';

function checkIsOpen(placeData) {
    if (!placeData) return false;
    if (placeData.isTemporarilyClosed) return false;
    if (!placeData.openTime || !placeData.closeTime || !placeData.operatingDays) return true;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const currentDay = days[now.getDay()];

    if (!placeData.operatingDays.includes(currentDay)) return false;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const openParts = placeData.openTime.split(':').map(Number);
    const closeParts = placeData.closeTime.split(':').map(Number);

    const currentMins = currentHour * 60 + currentMinute;
    const openMins = openParts[0] * 60 + openParts[1];
    const closeMins = closeParts[0] * 60 + closeParts[1];

    if (openMins <= closeMins) {
        return currentMins >= openMins && currentMins < closeMins;
    } else {
        return currentMins >= openMins || currentMins < closeMins;
    }
}

export default function RestaurantDetailPage() {
    const { user } = useUser();
    const params = useParams();
    const router = useRouter();
    const [resto, setResto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Reporting state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('Informasi Halal tidak akurat');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    useEffect(() => {
        if (user?.isLoggedIn && params?.id) {
            setIsBookmarked(user.bookmarks?.includes(params.id) || false);
        }
    }, [user, params?.id]);

    useEffect(() => {
        async function fetchPlace() {
            if (!params?.id) return;
            try {
                const docRef = doc(db, 'places', params.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Update view counter in the background
                    updateDoc(docRef, { views: increment(1) }).catch(e => console.error('Error updating views', e));

                    const data = docSnap.data();
                    setResto({
                        id: docSnap.id,
                        name: data.name || 'Restoran',
                        emoji: '🍽️',
                        rating: data.rating || 0,
                        reviews: data.reviewCount || 0,
                        views: data.views || 0,
                        badge: data.certBody ? 'certified' : 'muslim-owned',
                        badgeLabel: data.certBody ? '✅ Certified Halal' : '🕌 Muslim Owned',
                        category: data.category || 'Restoran',
                        address: data.address || 'Alamat tidak tersedia',
                        phone: data.phone || '',
                        lat: data.lat || null,
                        lng: data.lng || null,
                        hours: (data.openTime && data.closeTime)
                            ? `${data.openTime} - ${data.closeTime}`
                            : (data.operatingHours || 'Informasi jam buka tidak tersedia'),
                        isOpen: checkIsOpen(data),
                        lastChecked: data.certDate ? (data.certDate.toDate ? data.certDate.toDate().toLocaleDateString('id-ID') : new Date(data.certDate).toLocaleDateString('id-ID')) : 'Baru saja',
                        description: data.description || 'Restoran halal pilihan.',
                        certBody: data.certBody || 'Klaim Mandiri',
                        certNumber: data.certNumber || '-',
                        menu: [],
                        images: data.images || [],
                        photo: data.imageUrl || ((data.photos && data.photos.length > 0) ? data.photos[0] : ((data.images && data.images.length > 0) ? data.images[0] : null)),
                    });
                    // Load reviews
                    try {
                        const revs = await getRestaurantReviews(params.id);
                        setReviews(revs.filter(r => r.status === 'approved'));
                    } catch (e) { console.error('Reviews fetch error:', e); }
                }
            } catch (error) {
                console.error("Error fetching document:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlace();
    }, [params?.id]);

    const handleShare = async () => {
        const shareData = {
            title: resto.name,
            text: `${resto.name} - ${resto.badgeLabel}\n📍 ${resto.address}`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link telah disalin! 📋');
            }
        } catch (e) { /* user cancelled */ }
    };

    const handleDirections = () => {
        if (resto.lat && resto.lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${resto.lat},${resto.lng}`, '_blank');
        } else if (resto.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resto.address)}`, '_blank');
        } else {
            alert('Alamat tidak tersedia');
        }
    };

    const handleCall = () => {
        if (resto.phone) {
            window.open(`tel:${resto.phone}`, '_self');
        } else {
            alert('Nomor telepon tidak tersedia');
        }
    };

    const handleToggleBookmark = async () => {
        if (!user?.isLoggedIn) {
            alert("Silakan login terlebih dahulu untuk menyimpan bookmark.");
            return;
        }
        // Optimistic UI update
        setIsBookmarked(!isBookmarked);
        try {
            const result = await toggleBookmark(user.uid, params.id);
            setIsBookmarked(result);
        } catch (e) {
            console.error('Bookmark error:', e);
            setIsBookmarked(isBookmarked); // revert on error
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!user.isLoggedIn) {
            alert("Silakan login terlebih dahulu untuk melaporkan data.");
            return;
        }
        setIsSubmittingReport(true);
        try {
            await submitReport({
                type: 'place',
                targetId: resto.id,
                targetName: resto.name,
                reason: reportReason,
                reportedBy: user.uid,
                reportedByName: user.name || 'Anonymous'
            });
            setShowReportModal(false);
            alert("Terima kasih! Laporan Anda telah kami terima dan akan segera ditinjau oleh Admin.");
        } catch (err) {
            console.error(err);
            alert("Gagal mengirim laporan. Coba lagi nanti.");
        }
        setIsSubmittingReport(false);
    };

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
            <div className={styles.heroImage} style={(resto.images && resto.images.length > 0) ? { backgroundImage: `url('${resto.images[currentImageIndex] || resto.images[0]}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', transition: 'background-image 0.3s ease-in-out', backgroundColor: 'var(--halalqu-green)' } : (resto.photo ? { backgroundImage: `url('${resto.photo}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: 'var(--halalqu-green)' } : { backgroundColor: 'var(--halalqu-green)' })}>
                <div className={styles.heroOverlay}>
                    <button onClick={() => router.back()} className={styles.heroBtn}>←</button>
                    <div className={styles.heroActions}>
                        <button
                            className={styles.heroBtn}
                            onClick={handleToggleBookmark}
                            style={{ color: isBookmarked ? 'var(--danger)' : 'inherit' }}
                        >
                            {isBookmarked ? '❤️' : '🤍'}
                        </button>
                        <button className={styles.heroBtn} onClick={handleShare}>📤</button>
                    </div>
                </div>
                {!resto.photo && (!resto.images || resto.images.length === 0) && resto.emoji}

                {resto.images?.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? resto.images.length - 1 : prev - 1); }}
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                            &larr;
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % resto.images.length); }}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        >
                            &rarr;
                        </button>
                        <div style={{ position: 'absolute', bottom: '16px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 10 }}>
                            {resto.images.map((_, idx) => (
                                <div key={idx} style={{ width: currentImageIndex === idx ? '16px' : '6px', height: '6px', borderRadius: '3px', background: currentImageIndex === idx ? 'var(--halalqu-green)' : 'rgba(255,255,255,0.7)', transition: 'all 0.3s ease' }} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Info */}
            <section className={styles.infoSection}>
                <h1 className={styles.restoName}>{resto.name}</h1>

                <div className={styles.badgeRow}>
                    <span className={`badge badge-${resto.badge}`}>{resto.badgeLabel}</span>
                    <span className="stars">
                        ⭐ {resto.rating} ({resto.reviews} review) <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>•</span> 👁️ {resto.views} dilihat
                    </span>
                </div>

                <div className={styles.metaRow}>
                    <span>📍 {resto.address}</span>
                </div>
                {resto.phone && (
                    <div className={styles.metaRow}>
                        <span>📞 {resto.phone}</span>
                    </div>
                )}
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
                <button className={`${styles.actionBtn} ${styles.actionPrimary}`} onClick={handleDirections}>
                    🗺 Get Directions
                </button>
                <button className={`${styles.actionBtn} ${styles.actionSecondary}`} onClick={handleCall}>
                    📞 Telepon
                </button>
            </div>

            {/* About */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📜 Tentang</h2>
                <p className={styles.description}>{resto.description}</p>
            </section>

            {/* Certification */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📋 Sertifikasi</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Lembaga</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{resto.certBody ? resto.certBody.toUpperCase() : '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No. Halal</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{resto.certNumber || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Reviews */}
            <section className={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>💬 Review ({reviews.length})</h2>
                    <Link href={`/restaurant/${params.id}/review`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}>
                        ✏️ Tulis Review
                    </Link>
                </div>
                {reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>Belum ada review. Jadilah yang pertama!</p>
                ) : (
                    reviews.map(r => (
                        <div key={r.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.userName || 'Anonymous'}</span>
                                <span style={{ fontSize: '12px' }}>{'⭐'.repeat(r.tasteRating || 0)}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{r.comment || ''}</p>
                        </div>
                    ))
                )}
            </section>
            {/* Reports */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-md)' }}>
                <button onClick={() => setShowReportModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }}>
                    🚩 Laporkan Informasi Restoran Ini
                </button>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div style={{ background: 'var(--white)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--text-dark)' }}>Laporkan Data</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Pilih alasan kenapa informasi tempat ini kurang tepat:</p>

                        <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}>
                                <input type="radio" value="Toko sudah tutup permanen" checked={reportReason === 'Toko sudah tutup permanen'} onChange={e => setReportReason(e.target.value)} />
                                Toko sudah tutup permanen
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}>
                                <input type="radio" value="Informasi Halal tidak akurat" checked={reportReason === 'Informasi Halal tidak akurat'} onChange={e => setReportReason(e.target.value)} />
                                Informasi Halal tidak akurat
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}>
                                <input type="radio" value="Menu mengandung Babi/Khamr" checked={reportReason === 'Menu mengandung Babi/Khamr'} onChange={e => setReportReason(e.target.value)} />
                                Menu mengandung Babi/Alkohol
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}>
                                <input type="radio" value="Nama atau Alamat tidak sesuai" checked={reportReason === 'Nama atau Alamat tidak sesuai'} onChange={e => setReportReason(e.target.value)} />
                                Nama atau Alamat tidak sesuai
                            </label>

                            <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--space-md)' }}>
                                <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
                                <button type="submit" disabled={isSubmittingReport} className="btn btn-primary" style={{ flex: 1, border: 'none' }}>{isSubmittingReport ? 'Mengirim...' : 'Kirim'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
