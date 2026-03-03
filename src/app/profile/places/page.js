'use client';
import Link from 'next/link';

const places = [
    {
        id: 1, name: 'Mie Ayam Haji Mahmud', emoji: '🍜',
        status: 'verified', statusLabel: '✅ Verified',
        category: 'Street Food', date: '20 Feb 2026',
        views: 156,
    },
    {
        id: 2, name: 'Martabak Cairo', emoji: '🥞',
        status: 'pending', statusLabel: '⏳ Menunggu Verifikasi',
        category: 'Street Food', date: '28 Feb 2026',
        views: 0,
    },
    {
        id: 3, name: 'Resto Keluarga Sakinah', emoji: '🍛',
        status: 'verified', statusLabel: '✅ Verified',
        category: 'Indonesian', date: '05 Jan 2026',
        views: 89,
    },
];

const statusColors = {
    verified: { bg: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)' },
    pending: { bg: '#FFF8E7', color: '#D4920A' },
    rejected: { bg: '#FDE8E8', color: 'var(--danger)' },
};

export default function MyPlacesPage() {
    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Link href="/profile" style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                        background: 'var(--white)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', textDecoration: 'none',
                    }}>←</Link>
                    <div>
                        <h2 style={{ fontSize: '20px' }}>📍 Tempat Saya</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{places.length} tempat ditambahkan</p>
                    </div>
                </div>
                <Link href="/add-place" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                    ➕ Tambah
                </Link>
            </div>

            {/* Place List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {places.map((place, i) => {
                    const sc = statusColors[place.status];
                    return (
                        <div key={place.id} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                            animation: `fadeInUp 0.4s ease ${i * 0.08}s forwards`, opacity: 0,
                        }}>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--halalqu-green-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                                    flexShrink: 0,
                                }}>
                                    {place.emoji}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                        {place.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                            fontSize: '11px', fontWeight: 600,
                                            background: sc.bg, color: sc.color,
                                        }}>
                                            {place.statusLabel}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{place.category}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)',
                                fontSize: '12px', color: 'var(--text-muted)',
                            }}>
                                <span>📅 Ditambahkan {place.date}</span>
                                {place.status === 'verified' && <span>👁 {place.views} kali dilihat</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
