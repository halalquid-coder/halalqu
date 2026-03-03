import { db } from './firebase';
import {
    doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
    collection, query, where, orderBy, getDocs, serverTimestamp,
    arrayUnion, arrayRemove,
} from 'firebase/firestore';

// ============================================
// 👤 Users
// ============================================

export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), {
        name: data.name || '',
        email: data.email || '',
        role: 'user',
        merchantStatus: null,
        darkMode: false,
        language: 'id',
        bookmarks: [],
        stats: { reviews: 0, places: 0, bookmarks: 0 },
        contributorLevel: 'bronze',
        createdAt: serverTimestamp(),
    });
}

export async function updateUserProfile(uid, data) {
    await updateDoc(doc(db, 'users', uid), data);
}

// ============================================
// ❤️ Bookmarks
// ============================================

export async function toggleBookmark(uid, restaurantId) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const bookmarks = snap.data().bookmarks || [];
    const isBookmarked = bookmarks.includes(restaurantId);

    await updateDoc(userRef, {
        bookmarks: isBookmarked
            ? arrayRemove(restaurantId)
            : arrayUnion(restaurantId),
    });

    return !isBookmarked;
}

// ============================================
// 📍 Places (user-submitted restaurants)
// ============================================

export async function submitPlace(data) {
    const docRef = await addDoc(collection(db, 'places'), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getUserPlaces(uid) {
    const q = query(
        collection(db, 'places'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================================
// ✏️ Reviews
// ============================================

export async function submitReview(data) {
    const docRef = await addDoc(collection(db, 'reviews'), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getRestaurantReviews(restaurantId) {
    const q = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserReviews(uid) {
    const q = query(
        collection(db, 'reviews'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================================
// 🏪 Merchant Applications
// ============================================

export async function submitMerchantApplication(data) {
    const docRef = await addDoc(collection(db, 'merchant_applications'), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getMerchantApplication(uid) {
    const q = query(
        collection(db, 'merchant_applications'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.length > 0
        ? { id: snap.docs[0].id, ...snap.docs[0].data() }
        : null;
}

// ============================================
// 🔧 Admin
// ============================================

export async function getAllMerchantApplications() {
    const q = query(collection(db, 'merchant_applications'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateApplicationStatus(docId, status, merchantData = null) {
    await updateDoc(doc(db, 'merchant_applications', docId), {
        status, reviewedAt: serverTimestamp(),
    });

    if (status === 'approved' && merchantData && merchantData.userId) {
        // 1. Create Place Record
        const placeRef = await addDoc(collection(db, 'places'), {
            name: merchantData.restaurantName || merchantData.restoName || 'Unnamed Merchant',
            address: merchantData.address || '',
            phone: merchantData.phone || '',
            category: merchantData.category || '',
            certBody: merchantData.certBody || '',
            certNumber: merchantData.certNumber || '',
            halalQualifications: merchantData.halalQualifications || [],
            status: 'approved',
            source: 'merchant_registration',
            ownerId: merchantData.userId,
            createdAt: serverTimestamp(),
            rating: 0,
            reviewCount: 0
        });

        // 2. Update User Role
        await updateDoc(doc(db, 'users', merchantData.userId), {
            role: 'merchant',
            merchantStatus: 'approved',
            merchantInfo: {
                placeId: placeRef.id,
                restoName: merchantData.restaurantName || merchantData.restoName || 'Unnamed Merchant'
            }
        }).catch(err => console.error("Error updating user role:", err));
    }
}

export async function getAllPlaces() {
    const q = query(collection(db, 'places'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updatePlaceStatus(docId, status) {
    await updateDoc(doc(db, 'places', docId), {
        status, reviewedAt: serverTimestamp(),
    });
}

export async function getAllReviews() {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
