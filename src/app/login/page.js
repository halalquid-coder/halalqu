'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { createUserProfile } from '../lib/firestore';

export default function LoginPage() {
    const router = useRouter();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getErrorMessage = (code) => {
        const map = {
            'auth/email-already-in-use': 'Email sudah terdaftar. Silakan login.',
            'auth/invalid-email': 'Format email tidak valid.',
            'auth/weak-password': 'Password minimal 6 karakter.',
            'auth/user-not-found': 'Akun tidak ditemukan. Silakan daftar.',
            'auth/wrong-password': 'Password salah. Coba lagi.',
            'auth/invalid-credential': 'Email atau password salah.',
            'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
            'auth/popup-closed-by-user': 'Login dibatalkan.',
            'auth/network-request-failed': 'Tidak ada koneksi internet.',
        };
        return map[code] || 'Terjadi kesalahan. Coba lagi.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                // Register
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(result.user, { displayName: name });
                await createUserProfile(result.user.uid, { name, email });
            } else {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push('/');
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            router.push('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(getErrorMessage(err.code));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg-primary)',
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--halalqu-green-gradient)', padding: 'var(--space-2xl) var(--space-md)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-50px', right: '-30px',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-30px', left: '-30px',
                    width: '150px', height: '150px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                }} />

                <img src="/icon.svg" alt="Halalqu" style={{
                    width: '72px', height: '72px', marginBottom: 'var(--space-md)',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                }} />
                <img src="/logo-white.svg" alt="Halalqu" style={{
                    height: '36px', marginBottom: '4px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }} />
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    Cari Halal, Tanpa Ragu
                </p>
            </div>

            {/* Form Card */}
            <div style={{
                flex: 1, padding: 'var(--space-xl) var(--space-md)',
                maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto',
            }}>
                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                        background: '#FDE8E8', color: 'var(--danger)',
                        fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-md)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-md)',
                    padding: '4px', marginBottom: 'var(--space-xl)', boxShadow: 'var(--shadow-sm)',
                }}>
                    <button onClick={() => { setIsRegister(false); setError(''); }} style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: 'none',
                        transition: 'all 0.2s ease',
                        background: !isRegister ? 'var(--halalqu-green)' : 'transparent',
                        color: !isRegister ? 'var(--white)' : 'var(--text-secondary)',
                    }}>
                        Masuk
                    </button>
                    <button onClick={() => { setIsRegister(true); setError(''); }} style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: 'none',
                        transition: 'all 0.2s ease',
                        background: isRegister ? 'var(--halalqu-green)' : 'transparent',
                        color: isRegister ? 'var(--white)' : 'var(--text-secondary)',
                    }}>
                        Daftar
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                color: 'var(--text-secondary)', marginBottom: '6px',
                            }}>Nama Lengkap</label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                background: 'var(--white)', border: '1.5px solid var(--border)',
                                borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)',
                            }}>
                                <span>👤</span>
                                <input type="text" placeholder="Masukkan nama lengkap" value={name}
                                    onChange={(e) => setName(e.target.value)} required
                                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>Email</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                            background: 'var(--white)', border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)',
                        }}>
                            <span>📧</span>
                            <input type="email" placeholder="email@contoh.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{
                            display: 'block', fontSize: '13px', fontWeight: 600,
                            color: 'var(--text-secondary)', marginBottom: '6px',
                        }}>Password</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                            background: 'var(--white)', border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)',
                        }}>
                            <span>🔒</span>
                            <input type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter"
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                                minLength={6}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px' }}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}>
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {!isRegister && (
                        <div style={{ textAlign: 'right', marginBottom: 'var(--space-lg)' }}>
                            <span onClick={() => alert('Link reset password akan dikirim ke email Anda.')} style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 600, cursor: 'pointer' }}>
                                Lupa Password?
                            </span>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{
                        padding: '16px', fontSize: '16px', marginBottom: 'var(--space-lg)',
                        opacity: loading ? 0.7 : 1,
                    }}>
                        {loading ? '⏳ Memproses...' : isRegister ? '🚀 Daftar Sekarang' : '🔑 Masuk'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)',
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>atau</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Social Login */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <button onClick={handleGoogleLogin} disabled={loading} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)',
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--white)', border: '1.5px solid var(--border)',
                        fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s ease', color: 'var(--charcoal)',
                        opacity: loading ? 0.7 : 1,
                    }}>
                        <span style={{ fontSize: '18px' }}>🟢</span>
                        Lanjutkan dengan Google
                    </button>
                </div>

                <p style={{
                    textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)',
                    marginTop: 'var(--space-xl)', lineHeight: 1.6,
                }}>
                    Dengan {isRegister ? 'mendaftar' : 'masuk'}, kamu menyetujui{' '}
                    <span style={{ color: 'var(--halalqu-green)', fontWeight: 600 }}>Syarat & Ketentuan</span>{' '}
                    dan{' '}
                    <span style={{ color: 'var(--halalqu-green)', fontWeight: 600 }}>Kebijakan Privasi</span>{' '}
                    Halalqu.
                </p>
            </div>
        </div>
    );
}
