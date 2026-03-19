'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateUserProfile } from '../lib/firestore';
import { getRestaurantSlug } from '../lib/utils';

const tabs = ['Semua', '✅ Certified', '🕌 Muslim Owned'];

export default function BookmarksPage() {
    const { user, refreshUser } = useUser();
    const [activeTab, setActiveTab] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user.isLoggedIn) { setLoading(false); return; }
        loadBookmarks();
    }, [user.isLoggedIn, user.bookmarks]);

    const loadBookmarks = async () => {
        try {
            const bookmarkIds = user.bookmarks || [];
            if (bookmarkIds.length === 0) { setItems([]); setLoading(false); return; }

            const places = [];
            for (const id of bookmarkIds) {
                try {
                    const snap = await getDoc(doc(db, 'places', id));
                    if (snap.exists()) {
                        const val = snap.data();
                        places.push({
                            id: snap.id,
                            name: val.name || 'Restoran',
                            emoji: '🍽️',
                            badge: val.certBody ? 'certified' : 'muslim-owned',
                            badgeLabel: val.certBody ? '✅ Certified' : '🕌 Muslim Owned',
                            rating: val.rating || 0,
                            category: val.category || 'Restoran',
                            distance: '~ km',
                        });
                    }
                } catch (e) { /* skip failed fetches */ }
            }
            setItems(places);
        } catch (e) {
            console.error('Failed to load bookmarks:', e);
        } finally {
            setLoading(false);
        }
    };

    const removeBookmark = async (id) => {
        setItems(items.filter(item => item.id !== id));
        if (user.uid) {
            try {
                const newBookmarks = (user.bookmarks || []).filter(b => b !== id);
                await updateUserProfile(user.uid, { bookmarks: newBookmarks });
                await refreshUser();
            } catch (e) { console.error('Remove bookmark error:', e); }
        }
    };

    const filtered = activeTab === 0 ? items :
        activeTab === 1 ? items.filter(r => r.badge === 'certified') :
            items.filter(r => r.badge === 'muslim-owned');

    if (!user.isLoggedIn) {
        return (
            <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🔒</div>
                <h2>Login untuk melihat bookmark</h2>
                <Link href="/login" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Login →</Link>
            </div>
        );
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>←</Link>
                <div>
                    <h2 style={{ fontSize: '20px' }}>❤️ Bookmark Saya</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{items.length} tempat disimpan</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {tabs.map((tab, i) => (
                    <button key={i} className={`chip ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{tab}</button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'var(--space-xl)' }}>⏳ Memuat bookmark...</p>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📭</div>
                    <p>Belum ada bookmark</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {filtered.map(resto => (
                        <div key={resto.id} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                            <Link href={`/restaurant/${getRestaurantSlug(resto.name, resto.id)}`} style={{ display: 'flex', gap: 'var(--space-md)', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{resto.emoji}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{resto.name}</div>
                                    <span className={`badge badge-${resto.badge}`} style={{ fontSize: '11px' }}>{resto.badgeLabel}</span>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>⭐ {resto.rating} · {resto.category}</div>
                                </div>
                            </Link>
                            <button onClick={() => removeBookmark(resto.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', alignSelf: 'flex-start' }}>❤️</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
