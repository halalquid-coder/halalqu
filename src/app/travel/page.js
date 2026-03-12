'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

const countries = [
    { slug: 'indonesia', emoji: '🇮🇩', name: 'Indonesia', color: '#DC2626' },
    { slug: 'malaysia', emoji: '🇲🇾', name: 'Malaysia', color: '#1D4ED8' },
    { slug: 'singapura', emoji: '🇸🇬', name: 'Singapura', color: '#DC2626' },
    { slug: 'thailand', emoji: '🇹🇭', name: 'Thailand', color: '#1D4ED8' },
    { slug: 'jepang', emoji: '🇯🇵', name: 'Jepang', color: '#DC2626' },
    { slug: 'korea', emoji: '🇰🇷', name: 'Korea Selatan', color: '#1D4ED8' },
    { slug: 'turki', emoji: '🇹🇷', name: 'Turki', color: '#DC2626' },
    { slug: 'uae', emoji: '🇦🇪', name: 'UAE', color: '#047857' },
    { slug: 'arab-saudi', emoji: '🇸🇦', name: 'Arab Saudi', color: '#047857' },
    { slug: 'mesir', emoji: '🇪🇬', name: 'Mesir', color: '#B45309' },
    { slug: 'india', emoji: '🇮🇳', name: 'India', color: '#EA580C' },
    { slug: 'uk', emoji: '🇬🇧', name: 'Inggris', color: '#1D4ED8' },
    { slug: 'australia', emoji: '🇦🇺', name: 'Australia', color: '#1D4ED8' },
    { slug: 'amerika', emoji: '🇺🇸', name: 'Amerika Serikat', color: '#1D4ED8' },
];

export default function TravelPage() {
    const [search, setSearch] = useState('');
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        async function loadArticles() {
            try {
                const snap = await getDocs(
                    query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(6))
                );
                setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.warn('Error loading articles:', e); }
        }
        loadArticles();
    }, []);

    const filtered = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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

            {/* ═══════════════════════════════════════════ */}
            {/* 📰 SECTION: Artikel & Panduan Travel */}
            {/* ═══════════════════════════════════════════ */}
            {articles.length > 0 && (
                <section style={{ marginTop: 'var(--space-2xl)' }}>
                    <div className="section-header">
                        <h2 className="section-title">📰 Artikel & Panduan</h2>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                        {articles.map(article => (
                            <Link key={article.id} href={`/article/${article.id}`} style={{
                                flexShrink: 0, width: '260px', background: 'var(--white)',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                textDecoration: 'none', color: 'inherit',
                                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}>
                                <div style={{ height: '130px', background: 'var(--halalqu-green-light)', position: 'relative' }}>
                                    {article.coverImage ? (
                                        <img src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📰</div>
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                        background: 'var(--halalqu-green)', color: 'white',
                                        fontSize: '10px', fontWeight: 600,
                                    }}>
                                        {article.category}
                                    </div>
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <h3 style={{
                                        fontSize: '14px', fontWeight: 700, margin: '0 0 6px',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden', lineHeight: 1.4,
                                    }}>
                                        {article.title}
                                    </h3>
                                    {article.summary && (
                                        <p style={{
                                            fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px',
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden', lineHeight: 1.4,
                                        }}>
                                            {article.summary}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span>📅 {formatDate(article.createdAt)}</span>
                                        <span>·</span>
                                        <span>👁️ {article.views || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
