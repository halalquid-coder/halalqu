'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useUser } from '../../../context/UserContext';
import { updateUserProfile } from '../../../lib/firestore';

export default function ChangeEmailPage() {
    const { user } = useUser();
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // If not logged in or not Email provider (e.g., Google/FB login only)
    const isEmailUser = auth.currentUser?.providerData.some(p => p.providerId === 'password');

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newEmail === user.email) {
            return setError('Email baru harus berbeda dengan email saat ini.');
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
            setSuccess(true);
            setCurrentPassword('');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Password saat ini salah.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Email tersebut sudah digunakan oleh akun lain.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Terlalu banyak percobaan. Coba lagi nanti.');
            } else {
                setError('Gagal mengubah email. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user.isLoggedIn) {
        return (
            <div className="page container" style={{ paddingTop: 'var(--space-2xl)', textAlign: 'center' }}>
                <Link href="/profile/settings" style={{ color: 'var(--text-muted)' }}>← Kembali</Link>
                <div style={{ marginTop: 'var(--space-xl)' }}>Akses Dibatasi</div>
            </div>
        );
    }

    if (!isEmailUser) {
        return (
            <div className="page container" style={{ paddingTop: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                    <Link href="/profile/settings" style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                        background: 'var(--white)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none', color: 'var(--charcoal)'
                    }}>←</Link>
                    <h2 style={{ fontSize: '20px' }}>Ubah Email</h2>
                </div>

                <div style={{
                    padding: 'var(--space-xl)', background: '#FFF8E7', borderRadius: 'var(--radius-lg)',
                    textAlign: 'center', color: '#D4920A'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>ℹ️</div>
                    <p style={{ fontWeight: 600 }}>Tindakan Tidak Tersedia</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>
                        Anda login menggunakan akun Google atau Facebook. Email diatur oleh penyedia layanan Anda.
                    </p>
                </div>
            </div>
        );
    }

    const inputStyle = {
        width: '100%', padding: '12px var(--space-md)', background: 'var(--white)',
        border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
        fontSize: '15px', outline: 'none'
    };
    const labelStyle = {
        display: 'block', fontSize: '13px', fontWeight: 600,
        color: 'var(--text-secondary)', marginBottom: '6px'
    };

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile/settings" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', color: 'var(--charcoal)'
                }}>←</Link>
                <h2 style={{ fontSize: '20px' }}>Ubah Email</h2>
            </div>

            <form onSubmit={handleUpdateEmail} style={{ marginTop: 'var(--space-xl)' }}>
                {error && (
                    <div style={{
                        padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                        background: '#FDE8E8', color: 'var(--danger)', fontSize: '14px',
                        marginBottom: 'var(--space-md)'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                        background: '#D1FAE5', color: '#065F46', fontSize: '14px',
                        marginBottom: 'var(--space-md)'
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>Cek Inbox Anda!</p>
                        Link verifikasi telah dikirim ke email baru. Buka link tersebut untuk menyelesaikan proses reset email.
                    </div>
                )}

                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={labelStyle}>Email Saat Ini</label>
                    <input type="email" value={user.email || ''} disabled
                        style={{ ...inputStyle, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
                </div>

                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={labelStyle}>Password Saat Ini</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        required style={inputStyle} placeholder="Verifikasi identitas" />
                </div>

                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <label style={labelStyle}>Email Baru</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        required style={inputStyle} placeholder="Masukkan email baru" />
                </div>

                <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '16px', background: 'var(--halalqu-green)',
                    color: 'var(--white)', borderRadius: 'var(--radius-md)', border: 'none',
                    fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                }}>
                    {loading ? 'Memproses...' : 'Kirim Link Verifikasi'}
                </button>
            </form>
        </div>
    );
}
