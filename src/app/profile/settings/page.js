'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function SettingsPage() {
    const { user, darkMode, toggleDarkMode, language, setLanguage, logout, t } = useUser();
    const isMerchant = user.role === 'merchant';
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [locationAccess, setLocationAccess] = useState(true);
    const [halalStandard, setHalalStandard] = useState('all');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
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

                <SettingItem icon="🌐" label={t('language')} desc="Pilih bahasa tampilan">
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

                <SettingItem icon="🌙" label={t('darkMode')} desc={darkMode ? '✅ Aktif' : 'Tampilan lebih nyaman'}>
                    <Toggle value={darkMode} onChange={toggleDarkMode} />
                </SettingItem>

                <SettingItem icon="🔔" label={t('notifications')} desc="Terima update review & verifikasi">
                    <Toggle value={notifications} onChange={setNotifications} />
                </SettingItem>

                <SettingItem icon="📍" label={t('locationAccess')} desc="Untuk mencari restoran terdekat">
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

                <SettingItem icon="🕌" label={t('halalDefault')} desc="Filter default saat pencarian">
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

                <SettingItem icon="🔑" label={t('changePassword')}>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                </SettingItem>

                <SettingItem icon="📧" label={t('changeEmail')}>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                </SettingItem>

                {isMerchant ? (
                    <div onClick={() => router.push('/merchant/dashboard')} style={{ cursor: 'pointer' }}>
                        <SettingItem icon="🏪" label="Kelola Merchant" desc="Buka dashboard restoran">
                            <span style={{
                                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                                background: 'var(--halalqu-green)', color: '#FFFFFF',
                                fontSize: '12px', fontWeight: 600,
                            }}>
                                Dashboard →
                            </span>
                        </SettingItem>
                    </div>
                ) : user.merchantStatus === 'pending' ? (
                    <SettingItem icon="⏳" label="Pendaftaran Merchant" desc="Sedang dalam proses verifikasi">
                        <span style={{
                            padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                            background: '#FFF8E7', color: '#D4920A',
                            fontSize: '12px', fontWeight: 600,
                        }}>
                            Pending
                        </span>
                    </SettingItem>
                ) : (
                    <div onClick={() => router.push('/merchant/register')} style={{ cursor: 'pointer' }}>
                        <SettingItem icon="🏪" label="Daftar sebagai Merchant" desc="Kelola listing restoranmu">
                            <span style={{
                                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                                background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green)',
                                fontSize: '12px', fontWeight: 600,
                            }}>
                                Daftar →
                            </span>
                        </SettingItem>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                marginBottom: 'var(--space-lg)',
            }}>
                {!showLogoutConfirm ? (
                    <button onClick={() => setShowLogoutConfirm(true)} style={{
                        width: '100%', padding: 'var(--space-md)', background: '#FDE8E8',
                        color: 'var(--danger)', borderRadius: 'var(--radius-md)',
                        fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer',
                        marginBottom: 'var(--space-sm)',
                    }}>
                        {t('logout')}
                    </button>
                ) : (
                    <div style={{
                        padding: 'var(--space-md)', background: '#FDE8E8',
                        borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)',
                    }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                            Yakin ingin keluar?
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button onClick={() => setShowLogoutConfirm(false)} style={{
                                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--white)', border: '1px solid var(--border)',
                                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                color: 'var(--text-secondary)',
                            }}>
                                Batal
                            </button>
                            <button onClick={handleLogout} style={{
                                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--danger)', color: '#FFFFFF',
                                fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                            }}>
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                )}
                <button style={{
                    width: '100%', padding: 'var(--space-md)', background: 'none',
                    color: 'var(--danger)', borderRadius: 'var(--radius-md)',
                    fontWeight: 500, fontSize: '13px', border: 'none', cursor: 'pointer',
                }}>
                    {t('deleteAccount')}
                </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: 'var(--space-md) 0' }}>
                {t('version')}
            </p>
        </div>
    );
}
