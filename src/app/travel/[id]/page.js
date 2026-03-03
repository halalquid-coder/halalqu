'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const destinationData = {
    1: {
        name: 'Jakarta, Indonesia', emoji: '🕌', color: '#2E9B5A',
        desc: 'Ibukota Indonesia dengan ribuan pilihan makanan halal, dari warung pinggir jalan hingga restoran mewah.',
        restaurants: []
    },
};

const defaultDest = {
    name: 'Destinasi Wisata', emoji: '🌍', color: '#3D444B',
    desc: 'Temukan tempat makan halal terbaik di sekitar destinasi wisata ini.',
    restaurants: []
};

export default function TravelDetailPage() {
    const params = useParams();
    const dest = destinationData[params.id] || defaultDest;

    return (
        <div className="page container" style={{ paddingTop: 0 }}>
            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${dest.color} 0%, ${dest.color}dd 100%)`,
                margin: '0 calc(-1 * var(--space-md))', padding: 'var(--space-xl) var(--space-md)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-30px', right: '-20px',
                    fontSize: '120px', opacity: 0.1,
                }}>{dest.emoji}</div>

                <Link href="/travel" style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none', color: 'var(--white)',
                    marginBottom: 'var(--space-lg)',
                }}>←</Link>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '48px' }}>{dest.emoji}</span>
                    <h1 style={{ color: 'var(--white)', fontSize: '24px', margin: 'var(--space-sm) 0' }}>
                        {dest.name}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.6 }}>
                        {dest.desc}
                    </p>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                        padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                        marginTop: 'var(--space-md)', fontSize: '13px', color: 'var(--white)',
                    }}>
                        🍽 {dest.restaurants.length} tempat halal ditemukan
                    </div>
                </div>
            </div>

            {/* Restaurant List */}
            <div style={{ paddingTop: 'var(--space-lg)' }}>
                <h2 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                    Tempat Makan Halal
                </h2>

                {dest.restaurants.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-xl)' }}>Belum ada data restoran untuk destinasi ini.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {dest.restaurants.map((resto, i) => (
                            <Link key={i} href={`/restaurant/${resto.id}`} style={{
                                display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md)',
                                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-sm)', textDecoration: 'none', color: 'inherit',
                                transition: 'all 0.25s ease',
                                animation: `fadeInUp 0.4s ease ${i * 0.08}s forwards`, opacity: 0,
                            }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--halalqu-green-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0,
                                }}>
                                    {resto.emoji}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                        {resto.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px', flexWrap: 'wrap' }}>
                                        <span className={`badge badge-${resto.badge}`} style={{ fontSize: '11px' }}>
                                            {resto.badge === 'certified' ? '✅ Certified' : resto.badge === 'muslim-owned' ? '🕌 Muslim Owned' : '🥗 Halal Ing.'}
                                        </span>
                                        <span style={{ fontSize: '13px', color: 'var(--charcoal)', fontWeight: 600 }}>⭐ {resto.rating}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        📍 {resto.dist} · {resto.category}
                                    </div>
                                </div>
                                <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>→</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
