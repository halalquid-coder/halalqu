'use client';
import Link from 'next/link';
import { useState } from 'react';

const countries = [
    { slug: 'indonesia', emoji: '🇮🇩', name: 'Indonesia', color: '#DC2626', desc: 'Negeri halal terbesar di dunia' },
    { slug: 'malaysia', emoji: '🇲🇾', name: 'Malaysia', color: '#1D4ED8', desc: 'Pusat industri halal global' },
    { slug: 'singapura', emoji: '🇸🇬', name: 'Singapura', color: '#DC2626', desc: 'Kuliner halal premium Asia' },
    { slug: 'thailand', emoji: '🇹🇭', name: 'Thailand', color: '#1D4ED8', desc: 'Street food halal yang unik' },
    { slug: 'jepang', emoji: '🇯🇵', name: 'Jepang', color: '#DC2626', desc: 'Ramen & sushi halal' },
    { slug: 'korea', emoji: '🇰🇷', name: 'Korea Selatan', color: '#1D4ED8', desc: 'K-Food halal trending' },
    { slug: 'turki', emoji: '🇹🇷', name: 'Turki', color: '#DC2626', desc: 'Kebab & kuliner Ottoman' },
    { slug: 'uae', emoji: '🇦🇪', name: 'UAE', color: '#047857', desc: 'Dubai & Abu Dhabi halal dining' },
    { slug: 'arab-saudi', emoji: '🇸🇦', name: 'Arab Saudi', color: '#047857', desc: 'Haramain & kuliner Arab' },
    { slug: 'mesir', emoji: '🇪🇬', name: 'Mesir', color: '#B45309', desc: 'Kuliner Timur Tengah autentik' },
    { slug: 'india', emoji: '🇮🇳', name: 'India', color: '#EA580C', desc: 'Mughlai & biryani halal' },
    { slug: 'uk', emoji: '🇬🇧', name: 'Inggris', color: '#1D4ED8', desc: 'London halal food scene' },
    { slug: 'australia', emoji: '🇦🇺', name: 'Australia', color: '#1D4ED8', desc: 'Multicultural halal dining' },
    { slug: 'amerika', emoji: '🇺🇸', name: 'Amerika Serikat', color: '#1D4ED8', desc: 'Halal food movement' },
];

export default function TravelPage() {
    const [search, setSearch] = useState('');

    const filtered = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '96px' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>🌍 Travel Guide</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: 'var(--space-lg)' }}>
                Pilih negara tujuan untuk menemukan merchant & produk halal
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
                    type="text" placeholder="Cari negara..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', background: 'none' }}
                />
            </div>

            {/* Country Grid */}
            <div className="section-header">
                <h2 className="section-title">Pilih Negara</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{filtered.length} negara</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                {filtered.map(country => (
                    <Link key={country.slug} href={`/travel/${country.slug}`} className="card" style={{
                        padding: 'var(--space-md)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', textAlign: 'center', gap: '8px',
                        textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: `${country.color}12`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                        }}>
                            {country.emoji}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px' }}>
                                {country.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                                {country.desc}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>🔍</div>
                    <p>Negara &quot;{search}&quot; tidak ditemukan</p>
                </div>
            )}
        </div>
    );
}
