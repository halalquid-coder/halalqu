import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: "Mohon masukkan email di URL. Contoh: /api/make-admin?email=email.anda@gmail.com" }, { status: 400 });
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ error: `Tidak ditemukan user dengan email: ${email}. Harap Buat akun / Login dulu di aplikasi Utama pakai email ini.` }, { status: 404 });
        }

        const userDoc = querySnapshot.docs[0];

        await updateDoc(doc(db, 'users', userDoc.id), {
            role: 'admin'
        });

        return NextResponse.json({
            success: true,
            message: `SUKSES! Email ${email} berhasil diangkat menjadi Admin.`,
            next_step: `Silakan login kembali di Admin Panel menggunakan email ini dan password Anda.`
        });

    } catch (error) {
        console.error("Gagal update role:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server: " + error.message }, { status: 500 });
    }
}
