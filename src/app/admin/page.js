'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TABS = [
    { id: 'articles', label: '📝 Artikel', icon: '📝' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'places', label: '🏪 Merchants', icon: '🏪' },
];

export default function AdminPanel() {
    const { user, authLoading } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('articles');

    // Articles state
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [showArticleForm, setShowArticleForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [articleForm, setArticleForm] = useState({
        title: '', summary: '', content: '', coverImage: '', category: 'Travel Tips', status: 'published', country: '',
    });

    // Users state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Places state
    const [places, setPlaces] = useState([]);
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user.isLoggedIn || user.role !== 'admin')) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user.isLoggedIn || user.role !== 'admin') return;
        loadArticles();
        loadUsers();
        loadPlaces();
    }, [user]);

    const loadArticles = async () => {
        setLoadingArticles(true);
        try {
            const snap = await getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc')));
            setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        setLoadingArticles(false);
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const snap = await getDocs(collection(db, 'users'));
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        setLoadingUsers(false);
    };

    const loadPlaces = async () => {
        setLoadingPlaces(true);
        try {
            const snap = await getDocs(collection(db, 'places'));
            setPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        setLoadingPlaces(false);
    };

    const handleSaveArticle = async () => {
        if (!articleForm.title || !articleForm.content) {
            alert('Judul dan konten wajib diisi!');
            return;
        }
        try {
            if (editingArticle) {
                await updateDoc(doc(db, 'articles', editingArticle.id), {
                    ...articleForm,
                    updatedAt: serverTimestamp(),
                });
                alert('Artikel berhasil diperbarui! ✅');
            } else {
                await addDoc(collection(db, 'articles'), {
                    ...articleForm,
                    authorId: user.uid,
                    authorName: user.name || 'Admin',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    views: 0,
                });
                alert('Artikel berhasil ditambahkan! ✅');
            }
            setShowArticleForm(false);
            setEditingArticle(null);
            setArticleForm({ title: '', summary: '', content: '', coverImage: '', category: 'Travel Tips', status: 'published', country: '' });
            loadArticles();
        } catch (e) {
            alert('Gagal menyimpan artikel: ' + e.message);
        }
    };

    const handleDeleteArticle = async (id) => {
        if (!confirm('Yakin ingin menghapus artikel ini?')) return;
        try {
            await deleteDoc(doc(db, 'articles', id));
            loadArticles();
        } catch (e) { alert('Gagal menghapus: ' + e.message); }
    };

    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setArticleForm({
            title: article.title || '',
            summary: article.summary || '',
            content: article.content || '',
            coverImage: article.coverImage || '',
            category: article.category || 'Travel Tips',
            status: article.status || 'published',
            country: article.country || '',
        });
        setShowArticleForm(true);
    };

    if (authLoading || !user.isLoggedIn || user.role !== 'admin') {
        return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center' }}>⏳ Memuat...</div>;
    }

    const articleCategories = ['Travel Tips', 'Panduan Halal', 'Kuliner', 'Review', 'Berita', 'Edukasi'];

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '96px' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>🛡️ Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-xl)' }}>
                Kelola konten dan data Halalqu
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ background: 'var(--halalqu-green-light)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--halalqu-green)' }}>{articles.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Artikel</div>
                </div>
                <div style={{ background: '#EFF6FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1D4ED8' }}>{users.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Users</div>
                </div>
                <div style={{ background: '#FFF8E7', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>{places.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Merchants</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-xl)', overflowX: 'auto', paddingBottom: '4px' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '10px 16px', borderRadius: 'var(--radius-pill)', border: 'none',
                        background: activeTab === tab.id ? 'var(--halalqu-green)' : 'var(--white)',
                        color: activeTab === tab.id ? 'var(--white)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                        boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* ARTICLES TAB */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'articles' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>📝 Kelola Artikel</h2>
                        <button onClick={() => { setEditingArticle(null); setArticleForm({ title: '', summary: '', content: '', coverImage: '', category: 'Travel Tips', status: 'published', country: '' }); setShowArticleForm(true); }} style={{
                            padding: '8px 16px', background: 'var(--halalqu-green)', color: 'white',
                            border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        }}>
                            + Tambah Artikel
                        </button>
                    </div>

                    {/* Article Form Modal */}
                    {showArticleForm && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
                        }}>
                            <div style={{
                                background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)',
                                width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                            }}>
                                <h3 style={{ marginBottom: 'var(--space-md)' }}>
                                    {editingArticle ? '✏️ Edit Artikel' : '📝 Tambah Artikel Baru'}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    <input type="text" placeholder="Judul Artikel *" value={articleForm.title}
                                        onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
                                    />
                                    <input type="text" placeholder="Ringkasan singkat" value={articleForm.summary}
                                        onChange={e => setArticleForm({ ...articleForm, summary: e.target.value })}
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
                                    />
                                    <input type="url" placeholder="URL Cover Image" value={articleForm.coverImage}
                                        onChange={e => setArticleForm({ ...articleForm, coverImage: e.target.value })}
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={articleForm.category}
                                            onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}
                                            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px', background: 'white' }}
                                        >
                                            {articleCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select value={articleForm.status}
                                            onChange={e => setArticleForm({ ...articleForm, status: e.target.value })}
                                            style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px', background: 'white' }}
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                        </select>
                                    </div>
                                    <input type="text" placeholder="Negara terkait (opsional, misal: Indonesia)" value={articleForm.country}
                                        onChange={e => setArticleForm({ ...articleForm, country: e.target.value })}
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
                                    />
                                    <textarea placeholder="Konten Artikel * (tulis paragraf, pisahkan dengan baris kosong)" value={articleForm.content}
                                        onChange={e => setArticleForm({ ...articleForm, content: e.target.value })}
                                        rows={10}
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-md)' }}>
                                    <button onClick={handleSaveArticle} style={{
                                        flex: 1, padding: '12px', background: 'var(--halalqu-green)', color: 'white',
                                        border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        {editingArticle ? 'Simpan Perubahan' : 'Tambahkan Artikel'}
                                    </button>
                                    <button onClick={() => { setShowArticleForm(false); setEditingArticle(null); }} style={{
                                        padding: '12px 20px', background: '#F3F4F6', color: 'var(--text-secondary)',
                                        border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Article List */}
                    {loadingArticles ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat artikel...</p>
                    ) : articles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--white)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                            <p style={{ color: 'var(--text-muted)' }}>Belum ada artikel. Klik "Tambah Artikel" untuk memulai.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {articles.map(article => (
                                <div key={article.id} style={{
                                    background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)',
                                    boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 'var(--space-md)', alignItems: 'center',
                                }}>
                                    {article.coverImage ? (
                                        <img src={article.coverImage} alt="" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📝</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '14px', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{article.title}</h4>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: article.status === 'published' ? '#D1FAE5' : '#FEF3C7', color: article.status === 'published' ? '#065F46' : '#92400E', fontWeight: 600 }}>
                                                {article.status === 'published' ? '✅ Published' : '📝 Draft'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{article.category}</span>
                                            {article.country && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {article.country}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => handleEditArticle(article)} style={{ padding: '6px 10px', background: '#EFF6FF', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                                        <button onClick={() => handleDeleteArticle(article.id)} style={{ padding: '6px 10px', background: '#FDE8E8', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* USERS TAB */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'users' && (
                <div>
                    <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}>👥 Daftar Users ({users.length})</h2>
                    {loadingUsers ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {users.map(u => (
                                <div key={u.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        {u.role === 'admin' ? '🛡️' : u.role === 'merchant' ? '🏪' : '👤'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || 'No name'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: u.role === 'admin' ? '#FDE8E8' : u.role === 'merchant' ? '#FEF3C7' : '#D1FAE5', fontWeight: 600 }}>
                                        {u.role || 'user'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* PLACES TAB */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'places' && (
                <div>
                    <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}>🏪 Daftar Merchants ({places.length})</h2>
                    {loadingPlaces ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {places.map(p => (
                                <div key={p.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--halalqu-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🍽️</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address || '-'}</div>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: p.status === 'approved' ? '#D1FAE5' : '#FEF3C7', fontWeight: 600, color: p.status === 'approved' ? '#065F46' : '#92400E' }}>
                                        {p.status || 'pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
