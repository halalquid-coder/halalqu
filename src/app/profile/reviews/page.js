'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { getUserReviews } from '../../lib/firestore';

export default function MyReviewsPage() {
    const { user } = useUser();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user.isLoggedIn || !user.uid) { setLoading(false); return; }
        async function load() {
            try {
                const data = await getUserReviews(user.uid);
                setReviews(data);
            } catch (e) {
                console.error('Failed to load reviews:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user.uid, user.isLoggedIn]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.tasteRating || 0), 0) / reviews.length).toFixed(1)
        : '0';

    const approvedCount = reviews.filter(r => r.status === 'approved').length;

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <Link href="/profile" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>←</Link>
                <div>
                    <h2 style={{ fontSize: '20px' }}>Review Saya</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{reviews.length} review ditulis</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--halalqu-green)' }}>{reviews.length}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--halalqu-green)' }}>Total</div>
                </div>
                <div style={{ flex: 1, padding: 'var(--space-md)', background: '#FFF8E7', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#D4920A' }}>{avgRating}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#D4920A' }}>Rata-rata</div>
                </div>
                <div style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--halalqu-green)' }}>{approvedCount}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--halalqu-green)' }}>Disetujui</div>
                </div>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Memuat review...</p>
            ) : reviews.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>Belum ada review yang ditulis.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {reviews.map(review => {
                        const statusInfo = {
                            approved: { bg: '#D1FAE5', color: '#065F46', label: '✅ Disetujui' },
                            rejected: { bg: '#FEE2E2', color: '#991B1B', label: '❌ Ditolak' },
                            pending: { bg: '#FEF3C7', color: '#B45309', label: '🟡 Pending' },
                        };
                        const si = statusInfo[review.status] || statusInfo.pending;

                        return (
                            <div key={review.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                    <Link href={`/restaurant/${review.placeId}`} style={{ fontWeight: 600, fontSize: '14px', textDecoration: 'none', color: 'var(--charcoal)' }}>
                                        🍽️ {review.placeId ? `Restoran` : 'Restoran'}
                                    </Link>
                                    <span style={{ fontSize: '12px' }}>{'⭐'.repeat(review.tasteRating || 0)}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-sm)' }}>
                                    {review.comment || '(no comment)'}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 600, background: si.bg, color: si.color }}>{si.label}</span>
                                    {review.halalRating && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {review.halalRating === 'certified' ? '📜 Certified' : review.halalRating === 'muslim-owned' ? '🕌 Muslim Owned' : '🚫🐷 No Haram'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
