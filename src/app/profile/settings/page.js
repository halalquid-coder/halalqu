'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { getAuth, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SettingsPage() {
    const { user, darkMode, toggleDarkMode, language, setLanguage, logout, t, notificationsEnabled, toggleNotifications } = useUser();
    const isMerchant = user.role === 'merchant';
    const router = useRouter();
    const [locationAccess, setLocationAccess] = useState(true);
    const [halalStandard, setHalalStandard] = useState('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("User not found");

            // Delete user doc first (best effort)
            try {
                await deleteDoc(doc(db, 'users', user.uid));
            } catch (fsErr) {
                console.warn('Failed to delete Firestore doc:', fsErr);
            }

            // Delete auth user
            await deleteUser(currentUser);
            alert("Akun berhasil dihapus.");
            logout();
            router.push('/login');
        } catch (e) {
            console.error('Account deletion error:', e);
            if (e.code === 'auth/requires-recent-login') {
                alert("Silakan logout dan login kembali sebelum menghapus akun untuk alasan keamanan.");
            } else {
                alert("Gagal menghapus akun: " + e.message);
            }
            setShowDeleteConfirm(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const Toggle = ({ value, onChange }) => (
        <button onClick={() => onChange(!value)} style={{
            width: '52px', height: '28px', borderRadius: '14px',
            background: value ? 'var(--halalqu-green)' : 'var(--light-gray)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s ease', flexShrink: 0,
        }}>
            <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#FFFFFF', position: 'absolute',
                top: '3px', left: value ? '27px' : '3px',
                transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
        </button>
    );

    const SettingItem = ({ icon, label, desc, children }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
            padding: 'var(--space-md) 0', borderBottom: '1px solid var(--border)',
        }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '15px' }}>{label}</div>
                {desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>}
            </div>
            {children}
        </div>
    );

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <h2 style={{ fontSize: '20px' }}>{t('settings')}</h2>
            </div>

            {!user.isLoggedIn ? (
                <div style={{
                    textAlign: 'center', marginTop: 'var(--space-2xl)',
                    padding: 'var(--space-xl)', background: 'var(--white)',
                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🔒</div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>Akses Dibatasi</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-xl)' }}>
                        Silakan masuk ke akun Anda untuk mengakses halaman pengaturan.
                    </p>
                    <Link href="/login" style={{
                        display: 'inline-block', padding: '12px 24px',
                        background: 'var(--halalqu-green)', color: 'var(--white)',
                        borderRadius: 'var(--radius-md)', textDecoration: 'none',
                        fontWeight: 600, fontSize: '15px'
                    }}>
                        Masuk / Daftar
                    </Link>
                </div>
            ) : (
                <>
                    {/* General */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: '0 var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div style={{
                            padding: 'var(--space-md) 0', fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>{t('general')}</div>

                        <SettingItem icon="" label={t('language')} desc="Pilih bahasa tampilan">
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}
                                style={{
                                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)', fontSize: '14px',
                                    background: 'var(--white)', color: 'var(--charcoal)', cursor: 'pointer',
                                }}>
                                <option value="id">Bahasa Indonesia</option>
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                                <option value="ms">Bahasa Melayu</option>
                            </select>
                        </SettingItem>

                        <SettingItem icon="" label={t('darkMode')} desc={darkMode ? 'Aktif' : 'Tampilan lebih nyaman'}>
                            <Toggle value={darkMode} onChange={toggleDarkMode} />
                        </SettingItem>

                        <SettingItem icon="" label={t('notifications')} desc="Terima update review & verifikasi">
                            <Toggle value={notificationsEnabled} onChange={toggleNotifications} />
                        </SettingItem>

                        <SettingItem icon="" label={t('locationAccess')} desc="Untuk mencari restoran terdekat">
                            <Toggle value={locationAccess} onChange={setLocationAccess} />
                        </SettingItem>
                    </div>

                    {/* Halal Preferences */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: '0 var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div style={{
                            padding: 'var(--space-md) 0', fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>Preferensi Halal</div>

                        <SettingItem icon="" label={t('halalDefault')} desc="Filter default saat pencarian">
                            <select value={halalStandard} onChange={(e) => setHalalStandard(e.target.value)}
                                style={{
                                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)', fontSize: '14px',
                                    background: 'var(--white)', color: 'var(--charcoal)', cursor: 'pointer',
                                }}>
                                <option value="all">Semua</option>
                                <option value="certified">Certified Only</option>
                                <option value="muslim-owned">Muslim Owned</option>
                            </select>
                        </SettingItem>
                    </div>

                    {/* Account */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: '0 var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div style={{
                            padding: 'var(--space-md) 0', fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>{t('account')}</div>

                        <Link href="/profile/edit" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <SettingItem icon="" label="Edit Profil">
                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                            </SettingItem>
                        </Link>

                        <Link href="/profile/settings/password" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <SettingItem icon="" label={t('changePassword')}>
                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                            </SettingItem>
                        </Link>

                        <Link href="/profile/settings/email" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <SettingItem icon="" label={t('changeEmail')}>
                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                            </SettingItem>
                        </Link>
                    </div>

                    {/* Danger Zone */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        {/* Tombol Logout dihapus sesuai permintaan */}

                        {!showDeleteConfirm ? (
                            <button onClick={() => setShowDeleteConfirm(true)} style={{
                                width: '100%', padding: 'var(--space-md)', background: 'none',
                                color: 'var(--danger)', borderRadius: 'var(--radius-md)',
                                fontWeight: 500, fontSize: '13px', border: 'none', cursor: 'pointer',
                            }}>
                                {t('deleteAccount')}
                            </button>
                        ) : (
                            <div style={{
                                padding: 'var(--space-md)', background: '#FDE8E8',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px', textAlign: 'center' }}>
                                    Tindakan ini tidak dapat dibatalkan!
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--charcoal)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                                    Semua review, bookmark, dan info profil Anda akan dihapus permanen.
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--white)', border: '1px solid var(--border)',
                                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        Batal
                                    </button>
                                    <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{
                                        flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--danger)', color: '#FFFFFF',
                                        fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                    }}>
                                        {deleteLoading ? 'Menghapus...' : 'Hapus Permanen'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: 'var(--space-md) 0' }}>
                {t('version')}
            </p>
        </div>
    );
}
