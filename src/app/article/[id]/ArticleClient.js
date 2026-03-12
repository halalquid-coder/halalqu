'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ArticleClient({ id }) {
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!id) return;
            try {
                const docRef = doc(db, 'articles', id);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setArticle({ id: snap.id, ...snap.data() });
                    // Increment views
                    updateDoc(docRef, { views: increment(1) }).catch(() => {});
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: article.title, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link disalin! 📋');
            }
        } catch (e) { /* cancelled */ }
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat artikel...</div>;
    if (!article) return (
        <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
            <h2>Artikel tidak ditemukan</h2>
            <button onClick={() => router.back()} className="btn btn-primary" style={{ marginTop: '16px' }}>Kembali</button>
        </div>
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-md)', paddingBottom: '96px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-lg)' }}>
                <button onClick={() => router.back()} style={{
                    background: 'var(--white)', border: 'none', width: '36px', height: '36px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                }}>←</button>
                <span style={{ flex: 1 }} />
                <button onClick={handleShare} style={{
                    background: 'var(--white)', border: 'none', width: '36px', height: '36px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                }}>📤</button>
            </div>

            {/* Cover Image */}
            {article.coverImage && (
                <div style={{
                    width: '100%', height: '200px', borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden', marginBottom: 'var(--space-lg)', background: 'var(--halalqu-green-light)',
                }}>
                    <img src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}

            {/* Tags */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-pill)',
                    background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)',
                    fontSize: '12px', fontWeight: 600,
                }}>{article.category}</span>
                {article.country && (
                    <span style={{
                        padding: '4px 12px', borderRadius: 'var(--radius-pill)',
                        background: '#EFF6FF', color: '#1D4ED8',
                        fontSize: '12px', fontWeight: 600,
                    }}>{article.country}</span>
                )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.3, marginBottom: 'var(--space-sm)', color: 'var(--charcoal)' }}>
                {article.title}
            </h1>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span>✍️ {article.authorName || 'Admin'}</span>
                <span>·</span>
                <span>📅 {formatDate(article.createdAt)}</span>
                <span>·</span>
                <span>👁️ {article.views || 0}</span>
            </div>

            {/* Summary */}
            {article.summary && (
                <div style={{
                    background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md)', marginBottom: 'var(--space-xl)',
                    borderLeft: '4px solid var(--halalqu-green)',
                }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                        {article.summary}
                    </p>
                </div>
            )}

            {/* Content */}
            <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--charcoal)' }}>
                {article.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} style={{ marginBottom: 'var(--space-md)' }}>{paragraph}</p>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                marginTop: 'var(--space-2xl)', padding: 'var(--space-lg)', background: 'var(--white)',
                borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Artikel ini bermanfaat? Bagikan ke teman-temanmu!
                </p>
                <button onClick={handleShare} style={{
                    padding: '10px 24px', background: 'var(--halalqu-green)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer',
                }}>
                    📤 Bagikan Artikel
                </button>
            </div>
        </div>
    );
}
