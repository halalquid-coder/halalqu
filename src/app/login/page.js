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
import { FacebookAuthProvider } from 'firebase/auth';

const fbProvider = new FacebookAuthProvider();

export default function LoginPage() {
    const router = useRouter();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
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
            'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode login lain.',
        };
        return map[code] || 'Terjadi kesalahan. Coba lagi.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(result.user, { displayName: name });
                await createUserProfile(result.user.uid, { name, email, phone });
            } else {
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

    const handleFBLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, fbProvider);
            router.push('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(getErrorMessage(err.code));
            }
        } finally {
            setLoading(false);
        }
    };

    const inputWrap = {
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        background: 'var(--white)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)',
    };
    const inputStyle = {
        flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px',
    };
    const labelStyle = {
        display: 'block', fontSize: '13px', fontWeight: 600,
        color: 'var(--text-secondary)', marginBottom: '6px',
    };

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg-primary)',
        }}>
            {/* Header — centered logo only */}
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

                <img src="/logo-white.svg" alt="Halalqu" style={{
                    height: '40px', display: 'block', margin: '0 auto var(--space-sm)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }} />
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    Cari Halal, Tanpa Ragu
                </p>
            </div>

            {/* Form */}
            <div style={{
                flex: 1, padding: 'var(--space-xl) var(--space-md)',
                maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto',
            }}>
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
                        <>
                            {/* Name */}
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={labelStyle}>Nama Lengkap</label>
                                <div style={inputWrap}>
                                    <input type="text" placeholder="Masukkan nama lengkap" value={name}
                                        onChange={(e) => setName(e.target.value)} required style={inputStyle} />
                                </div>
                            </div>
                            {/* Phone */}
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={labelStyle}>No. Telepon</label>
                                <div style={inputWrap}>
                                    <input type="tel" placeholder="08xx-xxxx-xxxx" value={phone}
                                        onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={labelStyle}>Email</label>
                        <div style={inputWrap}>
                            <input type="email" placeholder="email@contoh.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={labelStyle}>Password</label>
                        <div style={inputWrap}>
                            <input type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter"
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                                minLength={6} style={inputStyle} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}>
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {!isRegister && (
                        <div style={{ textAlign: 'right', marginBottom: 'var(--space-lg)' }}>
                            <span onClick={() => alert('Link reset password akan dikirim ke email Anda.')}
                                style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 600, cursor: 'pointer' }}>
                                Lupa Password?
                            </span>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{
                        padding: '16px', fontSize: '16px', marginBottom: 'var(--space-lg)',
                        opacity: loading ? 0.7 : 1,
                    }}>
                        {loading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
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
                    {/* Google */}
                    <button onClick={handleGoogleLogin} disabled={loading} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)',
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--white)', border: '1.5px solid var(--border)',
                        fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s ease', color: 'var(--charcoal)',
                        opacity: loading ? 0.7 : 1,
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Lanjutkan dengan Google
                    </button>

                    {/* Facebook */}
                    <button onClick={handleFBLogin} disabled={loading} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)',
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                        background: '#1877F2', border: 'none',
                        fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s ease', color: '#fff',
                        opacity: loading ? 0.7 : 1,
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Lanjutkan dengan Facebook
                    </button>
                </div>

                <p style={{
                    textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)',
                    marginTop: 'var(--space-xl)', lineHeight: 1.6,
                }}>
                    Dengan {isRegister ? 'mendaftar' : 'masuk'}, kamu menyetujui{' '}
                    <Link href="/terms" style={{ color: 'var(--halalqu-green)', fontWeight: 600, textDecoration: 'none' }}>Syarat & Ketentuan</Link>{' '}
                    dan{' '}
                    <Link href="/privacy" style={{ color: 'var(--halalqu-green)', fontWeight: 600, textDecoration: 'none' }}>Kebijakan Privasi</Link>{' '}
                    Halalqu.
                </p>
            </div>
        </div>
    );
}
