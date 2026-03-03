'use client';
import Link from 'next/link';
import { useState } from 'react';

const destinations = [
    { id: 1, name: 'Jakarta, Indonesia', emoji: '🕌', count: 342, color: '#2E9B5A' },
    { id: 2, name: 'Kuala Lumpur, Malaysia', emoji: '🏙', count: 215, color: '#3D444B' },
    { id: 3, name: 'Istanbul, Turkey', emoji: '🕌', count: 187, color: '#D4920A' },
    { id: 4, name: 'Tokyo, Japan', emoji: '🗼', count: 89, color: '#E74C3C' },
    { id: 5, name: 'London, UK', emoji: '🎡', count: 156, color: '#2980B9' },
    { id: 6, name: 'Dubai, UAE', emoji: '🏗', count: 278, color: '#8E44AD' },
    { id: 7, name: 'Paris, France', emoji: '🗼', count: 72, color: '#16A085' },
    { id: 8, name: 'Seoul, South Korea', emoji: '🏯', count: 54, color: '#E67E22' },
];

const featured = [
    { title: '5 Tempat Halal di dekat Hagia Sophia', emoji: '🕌', city: 'Istanbul', count: 5 },
    { title: 'Makan Halal di Shinjuku', emoji: '🍜', city: 'Tokyo', count: 8 },
    { title: 'Street Food Halal di Petaling Jaya', emoji: '🍢', city: 'KL', count: 12 },
];

export default function TravelPage() {
    const [search, setSearch] = useState('');
    const filtered = destinations.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>🧳 Travel Guide</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: 'var(--space-lg)' }}>
                Temukan tempat makan halal di destinasi wisata favoritmu
            </p>

            {/* Search */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                background: 'var(--white)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '12px var(--space-md)',
                marginBottom: 'var(--space-xl)',
            }}>
                <span>🔍</span>
                <input
                    type="text" placeholder="Cari kota atau destinasi..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', background: 'none' }}
                />
            </div>

            {/* Featured Guides */}
            <div className="section-header">
                <h2 className="section-title">⭐ Kurasi Pilihan</h2>
            </div>
            <div className="scroll-row" style={{ marginBottom: 'var(--space-xl)' }}>
                {featured.map((item, i) => (
                    <div key={i} style={{
                        minWidth: '280px', padding: 'var(--space-lg)',
                        background: 'var(--halalqu-green-gradient)', borderRadius: 'var(--radius-lg)',
                        color: 'var(--white)', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-10px', fontSize: '80px', opacity: 0.15 }}>
                            {item.emoji}
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>📍 {item.city}</div>
                            <h3 style={{ fontSize: '16px', color: 'var(--white)', marginBottom: 'var(--space-sm)' }}>
                                {item.title}
                            </h3>
                            <span style={{ fontSize: '13px', opacity: 0.8 }}>{item.count} tempat halal →</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* All Destinations */}
            <div className="section-header">
                <h2 className="section-title">🌍 Semua Destinasi</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{filtered.length} kota</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                {filtered.map(dest => (
                    <Link key={dest.id} href={`/travel/${dest.id}`} className="card" style={{
                        padding: 'var(--space-md)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', textAlign: 'center', gap: 'var(--space-sm)',
                        textDecoration: 'none', color: 'inherit',
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: `${dest.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                        }}>
                            {dest.emoji}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px' }}>
                                {dest.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {dest.count} tempat halal
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
