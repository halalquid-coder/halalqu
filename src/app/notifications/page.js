'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserNotifications } from '../lib/firestore';

export default function NotificationsPage() {
    const { user, authLoading } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            if (authLoading) return;
            if (!user.isLoggedIn || !user.uid) {
                setLoading(false);
                return;
            }

            try {
                const data = await getUserNotifications(user.uid, user.role);
                setNotifications(data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, [user, authLoading]);

    const handleNotificationClick = async (notif) => {
        // Mark as read if unread
        if (!notif.read) {
            try {
                await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (e) {
                console.error("Gagal update read status", e);
            }
        }

        // Action routing based on type or title
        if (notif.type === 'welcome' || notif.title?.toLowerCase().includes('selamat datang')) {
            window.location.href = '/profile';
        } else if (notif.link) {
            window.location.href = notif.link;
        }
    };

    const formatTimeAgo = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <Link href="/" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', color: 'var(--charcoal)'
                }}>←</Link>
                <h2 style={{ fontSize: '20px' }}>Notifikasi</h2>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Memuat notifikasi...</div>
            ) : notifications.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)',
                    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)', marginTop: 'var(--space-sm)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📭</div>
                    <h3 style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>
                        Belum Ada Notifikasi
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Pembaruan, balasan review, dan promo akan muncul di sini.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                                background: notif.read ? 'var(--white)' : '#F0FDF4',
                                borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)',
                                boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 'var(--space-md)',
                                border: notif.read ? '1px solid var(--border)' : '1px solid #BBF7D0',
                                position: 'relative', overflow: 'hidden', cursor: 'pointer'
                            }}>
                            {!notif.read && (
                                <div style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: 'var(--halalqu-green)'
                                }} />
                            )}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: notif.read ? 'var(--bg-secondary)' : '#DCFCE7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px', flexShrink: 0
                            }}>
                                {notif.type === 'welcome' ? '🎉' : '📬'}
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--charcoal)' }}>
                                        {notif.title}
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                                    {notif.message}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {notif.createdAt ? formatTimeAgo(notif.createdAt) : 'Baru saja'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
