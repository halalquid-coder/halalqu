export default function PrivacyPage() {
    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '120px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: 'var(--space-lg)' }}>🔒 Kebijakan Privasi</h1>
            <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: 'var(--space-md)' }}>Terakhir diperbarui: 3 Maret 2026</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>1. Informasi yang Kami Kumpulkan</h3>
                <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar, termasuk nama, email, nomor telepon, dan foto profil. Kami juga mengumpulkan data penggunaan seperti lokasi (dengan izin), pencarian, dan review yang Anda tulis.</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>2. Penggunaan Informasi</h3>
                <p>Informasi digunakan untuk menyediakan layanan pencarian makanan halal, personalisasi pengalaman, dan meningkatkan kualitas layanan kami.</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>3. Perlindungan Data</h3>
                <p>Kami menggunakan Firebase Authentication dan Firestore dari Google Cloud Platform untuk menyimpan data Anda secara aman dengan enkripsi end-to-end.</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>4. Berbagi Data</h3>
                <p>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>5. Hak Pengguna</h3>
                <p>Anda berhak mengakses, mengubah, atau menghapus data pribadi Anda kapan saja melalui halaman pengaturan akun.</p>

                <h3 style={{ fontSize: '16px', color: 'var(--charcoal)', margin: 'var(--space-lg) 0 var(--space-sm)' }}>6. Kontak</h3>
                <p>Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami di <strong>privacy@halalqu.online</strong></p>
            </div>
        </div>
    );
}
