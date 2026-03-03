'use client';
import Link from 'next/link';

const reviews = [
    {
        id: 1, restoName: 'Warung Halal Barokah', restoEmoji: '🍛',
        rating: 5, halalTag: '✅ Yakin Halal', date: '25 Feb 2026',
        text: 'Dagingnya dijamin halal, bisa lihat sertifikat langsung di kasir.',
    },
    {
        id: 2, restoName: 'Kebab Istanbul', restoEmoji: '🥙',
        rating: 4, halalTag: '✅ Yakin Halal', date: '18 Feb 2026',
        text: 'Kebab-nya enak dan owner-nya orang Turki yang Muslim. Saya merasa yakin dengan kehalalannya.',
    },
    {
        id: 3, restoName: 'Sushi Zen Halal', restoEmoji: '🍱',
        rating: 5, halalTag: '✅ Yakin Halal', date: '10 Feb 2026',
        text: 'Sushi halal terbaik yang pernah saya coba! Fresh dan harganya worth it.',
    },
    {
        id: 4, restoName: 'Dim Sum Palace', restoEmoji: '🥟',
        rating: 3, halalTag: '⚠️ Ragu', date: '02 Feb 2026',
        text: 'Dim sum-nya enak tapi saya kurang yakin dengan sumber gelatin di dessert-nya.',
    },
];

export default function MyReviewsPage() {
    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <div>
                    <h2 style={{ fontSize: '20px' }}>📝 Review Saya</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{reviews.length} review ditulis</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{
                display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)',
            }}>
                <div style={{
                    flex: 1, padding: 'var(--space-md)', background: 'var(--halalqu-green-light)',
                    borderRadius: 'var(--radius-md)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--halalqu-green)' }}>{reviews.length}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--halalqu-green)' }}>Total</div>
                </div>
                <div style={{
                    flex: 1, padding: 'var(--space-md)', background: '#FFF8E7',
                    borderRadius: 'var(--radius-md)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#D4920A' }}>4.3</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#D4920A' }}>Rata-rata</div>
                </div>
                <div style={{
                    flex: 1, padding: 'var(--space-md)', background: 'var(--halalqu-green-light)',
                    borderRadius: 'var(--radius-md)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--halalqu-green)' }}>3</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--halalqu-green)' }}>Yakin Halal</div>
                </div>
            </div>

            {/* Review List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {reviews.map((review, i) => (
                    <div key={review.id} style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        animation: `fadeInUp 0.4s ease ${i * 0.08}s forwards`, opacity: 0,
                    }}>
                        {/* Restaurant info */}
                        <Link href={`/restaurant/${review.id}`} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                            marginBottom: 'var(--space-sm)', textDecoration: 'none', color: 'inherit',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--halalqu-green-light)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                            }}>
                                {review.restoEmoji}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{review.restoName}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{review.date}</div>
                            </div>
                            <span style={{ fontSize: '12px' }}>{'⭐'.repeat(review.rating)}</span>
                        </Link>

                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-sm)' }}>
                            {review.text}
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <span style={{
                                padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                fontSize: '11px', fontWeight: 600,
                                background: review.halalTag.includes('Yakin') ? 'var(--halalqu-green-light)' : '#FFF8E7',
                                color: review.halalTag.includes('Yakin') ? 'var(--halalqu-green)' : '#D4920A',
                            }}>
                                {review.halalTag}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
