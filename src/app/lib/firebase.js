import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app, auth, db, storage, messaging;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    // Initialize Messaging if supported (only works in browser context)
    if (typeof window !== 'undefined') {
        isSupported().then((supported) => {
            if (supported) messaging = getMessaging(app);
        });
    }
} else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
        isSupported().then((supported) => {
            if (supported) messaging = getMessaging(app);
        });
    }
}

export const requestNotificationPermission = async () => {
    try {
        const supported = await isSupported();
        if (!supported || !messaging) return null;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                // vapidKey is optional if provided in Firebase Console but standard best practice
                // vapidKey: 'YOUR_VAPID_KEY_HERE'
            });
            console.log("FCM Token Generated:", token);
            return token;
        } else {
            console.log("Notification permission not granted.");
            return null;
        }
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
        return null;
    }
};

export { auth, db, storage, messaging };
export const googleProvider = new GoogleAuthProvider();

export default app;
