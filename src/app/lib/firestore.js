import { db } from './firebase';
import { storage } from './firebase';
import {
    doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
    collection, query, where, orderBy, getDocs, serverTimestamp,
    arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
        readGlobalNotifications: [],
        stats: { reviews: 0, places: 0, bookmarks: 0 },
        contributorLevel: 'bronze',
        // Freemium scan quota
        tier: 'free',
        scanQuota: 5,
        scanUsed: 0,
        scanResetDate: null,
        createdAt: serverTimestamp(),
    });

    // Send welcome notification
    await addDoc(collection(db, 'notifications'), {
        title: 'Selamat Datang di Halalqu!',
        message: 'Temukan restoran halal terbaik di sekitarmu dan bagikan pengalamanmu. Mari membangun ekosistem kuliner halal bersama.',
        target: uid,
        type: 'welcome',
        read: false,
        createdAt: serverTimestamp()
    });
}

export async function updateUserProfile(uid, data) {
    await updateDoc(doc(db, 'users', uid), data);
}

// ============================================
// 🔋 Scan Quota Management
// ============================================

export async function checkAndResetScanQuota(uid) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    const tier = data.tier || 'free';
    const scanQuota = data.scanQuota || 5;
    let scanUsed = data.scanUsed || 0;
    const scanResetDate = data.scanResetDate;

    // Premium users have unlimited scans
    if (tier === 'premium') {
        return { tier, scanQuota: Infinity, scanUsed, remaining: Infinity };
    }

    // Check if we need to reset (new month)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastResetMonth = scanResetDate
        ? (scanResetDate.toDate ? scanResetDate.toDate() : new Date(scanResetDate))
        : null;
    const lastResetStr = lastResetMonth
        ? `${lastResetMonth.getFullYear()}-${String(lastResetMonth.getMonth() + 1).padStart(2, '0')}`
        : null;

    if (!lastResetStr || lastResetStr !== currentMonth) {
        // Reset scan count for new month
        scanUsed = 0;
        await updateDoc(userRef, {
            scanUsed: 0,
            scanResetDate: serverTimestamp(),
        });
    }

    return { tier, scanQuota, scanUsed, remaining: Math.max(0, scanQuota - scanUsed) };
}

export async function incrementScanUsage(uid) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    await updateDoc(userRef, {
        scanUsed: (data.scanUsed || 0) + 1,
    });
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

    const newBookmarkCount = isBookmarked ? bookmarks.length - 1 : bookmarks.length + 1;
    await updateDoc(userRef, {
        bookmarks: isBookmarked
            ? arrayRemove(restaurantId)
            : arrayUnion(restaurantId),
        'stats.bookmarks': newBookmarkCount,
    });

    return !isBookmarked;
}

// ============================================
// 📍 Places (user-submitted restaurants)
// ============================================

export async function submitPlace(data) {
    const docRef = await addDoc(collection(db, 'places'), {
        ...data,
        submittedBy: data.userId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    // Increment user's place count
    if (data.userId && data.userId !== 'anonymous') {
        try {
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentStats = userSnap.data().stats || { reviews: 0, places: 0, bookmarks: 0 };
                await updateDoc(userRef, {
                    'stats.places': (currentStats.places || 0) + 1,
                });
            }
        } catch (e) {
            console.warn('Failed to update user stats:', e);
        }
    }
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
    // Simple bad words dictionary for auto-moderation
    const badWords = ['anjing', 'babi', 'bangsat', 'tolol', 'goblok', 'kontol', 'memek', 'ngentot', 'tai', 'bajingan', 'kampret'];

    // Check if the comment contains any bad words
    const commentLower = (data.comment || '').toLowerCase();
    const hasBadWords = badWords.some(word => commentLower.includes(word));

    // Ensure placeId is set (for backward compatibility, accept restaurantId too)
    const reviewData = {
        ...data,
        placeId: data.placeId || data.restaurantId,
        status: hasBadWords ? 'pending' : 'approved',
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);

    // Increment user's review count in their profile stats
    if (data.userId && data.userId !== 'anonymous') {
        try {
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentStats = userSnap.data().stats || { reviews: 0, places: 0, bookmarks: 0 };
                await updateDoc(userRef, {
                    'stats.reviews': (currentStats.reviews || 0) + 1,
                });
            }
        } catch (e) {
            console.warn('Failed to update user stats:', e);
        }
    }
    return docRef.id;
}

export async function getRestaurantReviews(placeId) {
    const q = query(
        collection(db, 'reviews'),
        where('placeId', '==', placeId)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getUserReviews(uid) {
    const q = query(
        collection(db, 'reviews'),
        where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ============================================
// 🏪 Merchant Applications
// ============================================

export async function submitMerchantApplication(data) {
    // Check 2-store limit (free tier)
    if (data.userId && data.userId !== 'anonymous') {
        const existingQ = query(
            collection(db, 'merchant_applications'),
            where('userId', '==', data.userId)
        );
        const existingSnap = await getDocs(existingQ);
        const approvedCount = existingSnap.docs.filter(d => d.data().status === 'approved').length;
        if (approvedCount >= 2) {
            throw new Error('STORE_LIMIT_REACHED');
        }
    }

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
        where('userId', '==', uid)
        // No orderBy to avoid index requirement for MVP
    );
    const snap = await getDocs(q);
    // Sort manually by createdAt (simplistic)
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return docs.length > 0 ? docs[0] : null;
}

// ============================================
// 🔧 Admin
// ============================================

export async function getAllMerchantApplications() {
    // Removed orderBy to prevent index errors. Sort in memory.
    const q = query(collection(db, 'merchant_applications'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
            lat: merchantData.latitude || null,
            lng: merchantData.longitude || null,
            images: merchantData.photoUrls || [],
            imageUrl: merchantData.photoUrls?.[0] || '',
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

    // 3. Send notification to merchant
    if (merchantData?.userId) {
        try {
            await sendNotification({
                target: merchantData.userId,
                title: status === 'approved'
                    ? '🎉 Aplikasi Merchant Disetujui!'
                    : '❌ Aplikasi Merchant Ditolak',
                message: status === 'approved'
                    ? `Selamat! Restoran "${merchantData.restaurantName || merchantData.restoName}" telah disetujui dan sudah tampil di Halalqu.`
                    : `Maaf, aplikasi merchant Anda untuk "${merchantData.restaurantName || merchantData.restoName}" belum dapat disetujui saat ini.`,
                type: 'merchant_status',
            });
        } catch (e) {
            console.error('Failed to send merchant status notification:', e);
        }
    }
}

export async function getAllPlaces() {
    const q = query(collection(db, 'places'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function updatePlaceStatus(docId, status) {
    await updateDoc(doc(db, 'places', docId), {
        status, reviewedAt: serverTimestamp(),
    });

    // Send notification to the place submitter
    try {
        const placeSnap = await getDoc(doc(db, 'places', docId));
        if (placeSnap.exists()) {
            const placeData = placeSnap.data();
            const targetUser = placeData.submittedBy || placeData.ownerId;
            if (targetUser) {
                await sendNotification({
                    target: targetUser,
                    title: status === 'approved'
                        ? '✅ Tempat Disetujui!'
                        : '❌ Tempat Ditolak',
                    message: status === 'approved'
                        ? `"${placeData.name}" telah disetujui dan sekarang tampil di Halalqu!`
                        : `"${placeData.name}" belum dapat disetujui saat ini.`,
                    type: 'place_status',
                });
            }
        }
    } catch (e) {
        console.error('Failed to send place status notification:', e);
    }
}

// ============================================
// 🚩 Reports (Flagging)
// ============================================

export async function submitReport(data) {
    const docRef = await addDoc(collection(db, 'reports'), {
        ...data,
        status: 'open',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getAllReviews() {
    const q = query(collection(db, 'reviews'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getAllUsers() {
    const q = query(collection(db, 'users'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ============================================
// 🧳 Travel Destinations
// ============================================

export async function addTravelDestination(data) {
    const docRef = await addDoc(collection(db, 'travel_destinations'), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getAllTravelDestinations() {
    const q = query(collection(db, 'travel_destinations'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function updateTravelDestination(id, data) {
    await updateDoc(doc(db, 'travel_destinations', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteTravelDestination(id) {
    await deleteDoc(doc(db, 'travel_destinations', id));
}

// ============================================
// ✏️ Review Moderation
// ============================================

export async function updateReviewStatus(reviewId, status) {
    await updateDoc(doc(db, 'reviews', reviewId), {
        status, reviewedAt: serverTimestamp(),
    });

    const reviewSnap = await getDoc(doc(db, 'reviews', reviewId));
    if (reviewSnap.exists()) {
        const placeId = reviewSnap.data().placeId || reviewSnap.data().restaurantId;
        if (placeId) {
            const reviewsQ = query(
                collection(db, 'reviews'),
                where('placeId', '==', placeId),
                where('status', '==', 'approved')
            );
            const reviewsSnap = await getDocs(reviewsQ);

            let totalRating = 0;
            let reviewCount = reviewsSnap.size;
            reviewsSnap.forEach(r => totalRating += (r.data().rating || 0));

            const newRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;

            try {
                await updateDoc(doc(db, 'places', placeId), {
                    rating: newRating,
                    reviewCount: reviewCount
                });
            } catch (e) {
                console.error('Failed to update place rating:', e);
            }
        }
    }
}

// ============================================
// 📢 Notifications
// ============================================

export async function sendNotification(data) {
    const docRef = await addDoc(collection(db, 'notifications'), {
        ...data,
        createdAt: serverTimestamp(),
        read: false,
    });
    return docRef.id;
}

export async function getAllNotifications() {
    const q = query(collection(db, 'notifications'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getUserNotifications(uid, role = 'user') {
    // 1. Fetch personal notifications
    const pQ = query(
        collection(db, 'notifications'),
        where('target', '==', uid)
    );
    const pSnap = await getDocs(pQ);
    const personal = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch user profile to get read global notifications and registration date
    const userDoc = await getDoc(doc(db, 'users', uid));
    const readGlobal = userDoc.exists() ? (userDoc.data().readGlobalNotifications || []) : [];
    const userCreatedAt = userDoc.exists() ? userDoc.data().createdAt : null;

    // 2. Fetch global broadcast notifications
    const globalTargets = ['all'];
    if (role) globalTargets.push(role); // 'user' or 'merchant'

    let global = [];
    try {
        const gQ = query(
            collection(db, 'global_notifications'),
            where('target', 'in', globalTargets)
        );
        const gSnap = await getDocs(gQ);
        global = gSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            isGlobal: true,
            read: readGlobal.includes(d.id)
        })).filter(n => {
            // Only show broadcasts created AFTER the user registered
            if (!userCreatedAt || !n.createdAt) return true;
            const userTime = userCreatedAt.seconds || 0;
            const notifTime = n.createdAt.seconds || 0;
            return notifTime >= userTime;
        });
    } catch (e) {
        console.warn('global_notifications not found or error:', e);
    }

    // Combine and sort by date descending
    const combined = [...personal, ...global];
    return combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}


// ============================================
// 📸 Image Upload (Firebase Storage)
// ============================================

export async function uploadImage(file, path) {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
}
