'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AllArticlesPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function load() {
            try {
                const snap = await getDocs(collection(db, 'articles'));
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const published = all
                    .filter(a => a.status === 'published')
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setArticles(published);
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
    }, []);

    const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))];
    const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter);

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="page container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat artikel...
        </div>
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: '96px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-lg)' }}>
                <Link href="/travel" style={{
                    background: 'var(--white)', width: '36px', height: '36px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none', color: 'inherit', boxShadow: 'var(--shadow-sm)',
                }}>←</Link>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>📰 Semua Artikel</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{articles.length} artikel</p>
                </div>
            </div>

            {/* Category Filter */}
            <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
                marginBottom: 'var(--space-lg)', scrollbarWidth: 'none',
            }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)} style={{
                        flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                        border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: filter === cat ? 'var(--halalqu-green)' : 'var(--white)',
                        color: filter === cat ? 'white' : 'var(--text-secondary)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s',
                    }}>
                        {cat === 'all' ? 'Semua' : cat}
                    </button>
                ))}
            </div>

            {/* Articles List */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                    <p>Belum ada artikel di kategori ini.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {filtered.map(article => (
                        <Link key={article.id} href={`/article/${article.id}`} style={{
                            display: 'flex', gap: 'var(--space-md)', textDecoration: 'none', color: 'inherit',
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)', transition: 'transform 0.2s',
                        }}>
                            {/* Thumbnail */}
                            {article.coverImage ? (
                                <img src={article.coverImage} alt={article.title} style={{
                                    width: '110px', minHeight: '100px', objectFit: 'cover', flexShrink: 0,
                                }} />
                            ) : (
                                <div style={{
                                    width: '110px', minHeight: '100px', flexShrink: 0,
                                    background: 'var(--halalqu-green-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                                }}>📰</div>
                            )}
                            {/* Info */}
                            <div style={{ padding: '10px 12px 10px 0', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                                        background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)',
                                        fontSize: '10px', fontWeight: 600,
                                    }}>{article.category}</span>
                                    {article.country && (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                                            background: '#EFF6FF', color: '#1D4ED8',
                                            fontSize: '10px', fontWeight: 600,
                                        }}>{article.country}</span>
                                    )}
                                </div>
                                <h3 style={{
                                    fontSize: '14px', fontWeight: 700, margin: '0 0 6px',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden', lineHeight: 1.3,
                                }}>{article.title}</h3>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    📅 {formatDate(article.createdAt)} · 👁️ {article.views || 0}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
