'use client';
import Link from 'next/link';

export default function NotificationsPage() {
    // For now, static notifications since we don't have a backend system for it yet.
    // In the future this will be fetched from Firestore.
    const notifications = [
        {
            id: 1,
            title: 'Selamat Datang di Halalqu!',
            message: 'Temukan restoran halal terbaik di sekitarmu dan bagikan pengalamanmu. Mari membangun ekosistem kuliner halal bersama.',
            date: 'Baru Saja',
            read: false,
            icon: '🎉',
            type: 'system'
        },
        {
            id: 2,
            title: 'Review Pertamamu',
            message: 'Terima kasih telah bergabung! Yuk tulis review pertamamu untuk membantu Muslim lainnya menemukan tempat makan yang terpercaya.',
            date: '1 hari yang lalu',
            read: true,
            icon: '✍️',
            type: 'action'
        }
    ];

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

            {notifications.length === 0 ? (
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
                        <div key={notif.id} style={{
                            background: notif.read ? 'var(--white)' : '#F0FDF4',
                            borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)',
                            boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 'var(--space-md)',
                            border: notif.read ? '1px solid var(--border)' : '1px solid #BBF7D0',
                            position: 'relative', overflow: 'hidden'
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
                                {notif.icon}
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
                                    {notif.date}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
