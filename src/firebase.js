import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Configuration Retriever (checks environment first, then localStorage)
export const getSystemConfig = () => {
  const localConfig = localStorage.getItem('gym_system_config');
  let configObj = {};
  if (localConfig) {
    try {
      configObj = JSON.parse(localConfig);
    } catch (e) {
      console.error("Failed to parse config from localStorage", e);
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configObj.firebaseApiKey || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configObj.firebaseAuthDomain || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configObj.firebaseProjectId || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configObj.firebaseStorageBucket || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configObj.firebaseMessagingSenderId || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || configObj.firebaseAppId || "",
    cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || configObj.cloudinaryCloudName || "",
    cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || configObj.cloudinaryUploadPreset || "",
    adminPasscode: configObj.adminPasscode || import.meta.env.VITE_ADMIN_PASSCODE || "1234"
  };
};

export const saveSystemConfig = (newConfig) => {
  localStorage.setItem('gym_system_config', JSON.stringify(newConfig));
  // Clear any existing initialized app so it re-initializes on next call
  // This helps reload the firebase service instantly when settings change
};

export const isFirebaseConfigured = () => {
  const config = getSystemConfig();
  return !!(config.apiKey && config.projectId);
};

// Singleton Firebase References
let firebaseApp = null;
let db = null;

const getDb = () => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured yet. Set up credentials in settings.");
  }
  
  if (!db) {
    const config = getSystemConfig();
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    };
    
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    db = getFirestore(firebaseApp);
  }
  return db;
};

// Firestore Collection Helper
const getMembersCollection = () => {
  const database = getDb();
  return collection(database, 'members');
};

/**
 * Clean phone numbers to digits only for reliable matching
 */
export const cleanPhone = (phoneStr) => {
  if (!phoneStr) return "";
  return phoneStr.replace(/\D/g, "");
};

/**
 * Fetch all gym members ordered by registration date / member ID
 */
export const getMembers = async () => {
  try {
    const colRef = getMembersCollection();
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      docId: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Firestore getMembers failed:", error);
    throw error;
  }
};

/**
 * Search member by Cleaned Phone Number
 */
export const searchMemberByPhone = async (phone) => {
  try {
    const cleaned = cleanPhone(phone);
    if (!cleaned) return [];
    
    const colRef = getMembersCollection();
    // Querying matching cleanedPhone value
    const q = query(colRef, where('cleanedPhone', '==', cleaned), limit(1));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => ({
      docId: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Firestore searchMemberByPhone failed:", error);
    throw error;
  }
};

/**
 * Add a new member
 */
export const addMember = async (memberData) => {
  try {
    const colRef = getMembersCollection();
    
    // Auto-generate numeric ID sequence if not provided
    let nextId = memberData.id;
    if (!nextId) {
      const snapshot = await getDocs(colRef);
      let maxVal = 0;
      snapshot.docs.forEach(docSnap => {
        const val = parseInt(docSnap.data().id, 10);
        if (!isNaN(val) && val > maxVal) {
          maxVal = val;
        }
      });
      nextId = (maxVal + 1).toString();
    }

    const payload = {
      id: nextId,
      name: memberData.name.trim(),
      phone: memberData.phone.trim(),
      cleanedPhone: cleanPhone(memberData.phone),
      monthsPaid: parseInt(memberData.monthsPaid, 10) || 1,
      startDate: memberData.startDate, // Store as ISO String date 'YYYY-MM-DD'
      expiryDate: memberData.expiryDate, // Store as ISO String date 'YYYY-MM-DD'
      photoUrl: memberData.photoUrl || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(colRef, payload);
    return { docId: docRef.id, ...payload };
  } catch (error) {
    console.error("Firestore addMember failed:", error);
    throw error;
  }
};

/**
 * Update member details
 */
export const updateMember = async (docId, memberData) => {
  try {
    const dbInstance = getDb();
    const docRef = doc(dbInstance, 'members', docId);
    
    const payload = {
      id: memberData.id,
      name: memberData.name.trim(),
      phone: memberData.phone.trim(),
      cleanedPhone: cleanPhone(memberData.phone),
      monthsPaid: parseInt(memberData.monthsPaid, 10) || 1,
      startDate: memberData.startDate,
      expiryDate: memberData.expiryDate,
      photoUrl: memberData.photoUrl || "",
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, payload);
    return { docId, ...payload };
  } catch (error) {
    console.error("Firestore updateMember failed:", error);
    throw error;
  }
};

/**
 * Delete a member
 */
export const deleteMember = async (docId) => {
  try {
    const dbInstance = getDb();
    const docRef = doc(dbInstance, 'members', docId);
    await deleteDoc(docRef);
    return docId;
  } catch (error) {
    console.error("Firestore deleteMember failed:", error);
    throw error;
  }
};

// ==========================================
// Staff Authentication & Management CRUD
// ==========================================

const getStaffCollection = () => {
  const database = getDb();
  return collection(database, 'staff');
};

/**
 * Seed default admin if staff collection is completely empty
 */
export const seedDefaultAdmin = async () => {
  try {
    const colRef = getStaffCollection();
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log("Seeding default admin account...");
      const payload = {
        email: "admin@hrgym.com",
        name: "Administrator",
        password: "admin123", // plaintext password for simple gym validation
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(colRef, payload);
    }
  } catch (error) {
    console.warn("Auto-seeding admin failed (database may be uninitialized):", error);
  }
};

/**
 * Authenticate a user by email and password
 */
export const authenticateUser = async (email, password) => {
  try {
    // Run seed check first to ensure database has at least the default admin account
    await seedDefaultAdmin();

    const colRef = getStaffCollection();
    const cleanEmail = email.trim().toLowerCase();
    
    // Find matching email
    const q = query(colRef, where('email', '==', cleanEmail), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error("User account not found");
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password !== password) {
      throw new Error("Incorrect password");
    }
    
    return {
      docId: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    };
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
};

/**
 * Retrieve all staff users (Admin only)
 */
export const getStaffUsers = async () => {
  try {
    const colRef = getStaffCollection();
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      docId: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Firestore getStaffUsers failed:", error);
    throw error;
  }
};

/**
 * Add a new staff user (Admin only)
 */
export const addStaffUser = async (staffData) => {
  try {
    const colRef = getStaffCollection();
    
    // Check if email already exists
    const cleanEmail = staffData.email.trim().toLowerCase();
    const q = query(colRef, where('email', '==', cleanEmail), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("Email already registered to another staff member");
    }

    const payload = {
      email: cleanEmail,
      name: staffData.name.trim(),
      password: staffData.password.trim(),
      role: staffData.role || "staff", // "staff" or "admin"
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(colRef, payload);
    return { docId: docRef.id, ...payload };
  } catch (error) {
    console.error("Firestore addStaffUser failed:", error);
    throw error;
  }
};

/**
 * Update staff details (Admin only)
 */
export const updateStaffUser = async (docId, staffData) => {
  try {
    const dbInstance = getDb();
    const docRef = doc(dbInstance, 'staff', docId);
    
    const payload = {
      email: staffData.email.trim().toLowerCase(),
      name: staffData.name.trim(),
      password: staffData.password.trim(),
      role: staffData.role || "staff",
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, payload);
    return { docId, ...payload };
  } catch (error) {
    console.error("Firestore updateStaffUser failed:", error);
    throw error;
  }
};

/**
 * Delete a staff user (Admin only)
 */
export const deleteStaffUser = async (docId) => {
  try {
    const dbInstance = getDb();
    const docRef = doc(dbInstance, 'staff', docId);
    await deleteDoc(docRef);
    return docId;
  } catch (error) {
    console.error("Firestore deleteStaffUser failed:", error);
    throw error;
  }
};
