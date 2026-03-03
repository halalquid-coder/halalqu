'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function BookmarksPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [items, setItems] = useState([]);

    const filtered = activeTab === 0 ? items :
        activeTab === 1 ? items.filter(r => r.badge === 'certified') :
            items.filter(r => r.badge === 'muslim-owned');

    const removeBookmark = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <div>
                    <h2 style={{ fontSize: '20px' }}>❤️ Bookmark Saya</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{items.length} tempat disimpan</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
                overflowX: 'auto', scrollbarWidth: 'none',
            }}>
                {tabs.map((tab, i) => (
                    <button key={i}
                        className={`chip ${activeTab === i ? 'active' : ''}`}
                        onClick={() => setActiveTab(i)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 'var(--space-2xl) 0',
                    color: 'var(--text-muted)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📭</div>
                    <p>Belum ada bookmark di kategori ini</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {filtered.map((resto, i) => (
                        <div key={resto.id} style={{
                            display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md)',
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)', position: 'relative',
                            animation: `fadeInUp 0.4s ease ${i * 0.05}s forwards`, opacity: 0,
                        }}>
                            <Link href={`/restaurant/${resto.id}`} style={{
                                display: 'flex', gap: 'var(--space-md)', flex: 1, textDecoration: 'none', color: 'inherit',
                            }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--halalqu-green-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0,
                                }}>
                                    {resto.emoji}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                        {resto.name}
                                    </div>
                                    <span className={`badge badge-${resto.badge}`} style={{ fontSize: '11px' }}>{resto.badgeLabel}</span>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: 'var(--space-sm)' }}>
                                        <span>⭐ {resto.rating}</span>
                                        <span>📍 {resto.distance}</span>
                                    </div>
                                </div>
                            </Link>
                            <button onClick={() => removeBookmark(resto.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '18px', padding: '4px', alignSelf: 'flex-start',
                            }} title="Hapus bookmark">
                                ❤️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
