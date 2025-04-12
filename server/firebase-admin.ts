import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, this utilizzerà le credenziali predefinite di Firebase Functions
// In development, puoi specificare un file di credenziali serviceAccountKey.json
if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'production') {
    // In ambiente di produzione, Firebase Functions fornisce automaticamente le credenziali
    admin.initializeApp();
  } else {
    // In ambiente di sviluppo, puoi utilizzare un file di credenziali
    try {
      admin.initializeApp({
        // Se hai un file di credenziali, puoi specificarlo qui
        // credential: admin.credential.cert(require('../serviceAccountKey.json')),
        // Altrimenti, puoi utilizzare le credenziali predefinite
        credential: admin.credential.applicationDefault(),
      });
    } catch (error) {
      console.error('Errore nell\'inizializzazione di Firebase Admin:', error);
      // Fallback: inizializza senza credenziali esplicite
      admin.initializeApp();
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

// Esporta le collezioni principali
export const usersCollection = db.collection('users');
export const scansCollection = db.collection('scans');
export const complianceCollection = db.collection('compliance');
export const reportsCollection = db.collection('reports');
