'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useUser } from '../../../context/UserContext';

export default function ChangePasswordPage() {
    const { user } = useUser();
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // If not logged in or not Email provider (e.g., Google/FB login only)
    const isEmailUser = auth.currentUser?.providerData.some(p => p.providerId === 'password');

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            return setError('Password baru dan konfirmasi password tidak cocok.');
        }

        if (newPassword.length < 6) {
            return setError('Password minimal 6 karakter.');
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            await updatePassword(auth.currentUser, newPassword);
            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Password saat ini salah.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Terlalu banyak percobaan. Coba lagi nanti.');
            } else {
                setError('Gagal mengubah password. Silakan coba lagi.');
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
                    <h2 style={{ fontSize: '20px' }}>Ubah Password</h2>
                </div>

                <div style={{
                    padding: 'var(--space-xl)', background: '#FFF8E7', borderRadius: 'var(--radius-lg)',
                    textAlign: 'center', color: '#D4920A'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>ℹ️</div>
                    <p style={{ fontWeight: 600 }}>Tindakan Tidak Tersedia</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>
                        Anda login menggunakan akun Google atau Facebook. Password diatur oleh penyedia layanan Anda.
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
                <h2 style={{ fontSize: '20px' }}>Ubah Password</h2>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ marginTop: 'var(--space-xl)' }}>
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
                        Password berhasil diperbarui!
                    </div>
                )}

                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={labelStyle}>Password Saat Ini</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        required style={inputStyle} placeholder="Masukkan password lama" />
                </div>

                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={labelStyle}>Password Baru</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        required minLength={6} style={inputStyle} placeholder="Minimal 6 karakter" />
                </div>

                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <label style={labelStyle}>Konfirmasi Password Baru</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        required minLength={6} style={inputStyle} placeholder="Ulangi password baru" />
                </div>

                <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '16px', background: 'var(--halalqu-green)',
                    color: 'var(--white)', borderRadius: 'var(--radius-md)', border: 'none',
                    fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                }}>
                    {loading ? 'Menyimpan...' : 'Simpan Password'}
                </button>
            </form>
        </div>
    );
}
