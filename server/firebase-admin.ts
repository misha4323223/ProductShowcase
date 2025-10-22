import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) {
    return admin;
  }

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      const serviceAccountKey = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: serviceAccountKey.project_id || 'sweetweb-3543f',
      });
      
      initialized = true;
      console.log('Firebase Admin initialized with service account');
    } else {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        
        initialized = true;
        console.log('Firebase Admin initialized with application default credentials');
      } catch (error) {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'sweetweb-3543f';
        
        admin.initializeApp({
          projectId,
        });
        
        initialized = true;
        console.warn('Firebase Admin initialized WITHOUT credentials - token verification will fail');
        console.warn('Please set FIREBASE_SERVICE_ACCOUNT in environment variables');
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }

  return admin;
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

export function isAdmin(decodedToken: admin.auth.DecodedIdToken): boolean {
  return decodedToken.email?.toLowerCase() === 'pimashin2015@gmail.com';
}
