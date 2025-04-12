import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}

// Get Firestore instance
export const firestore = getFirestore();

// Collection references
export const usersCollection = firestore.collection('users');
export const scansCollection = firestore.collection('scans');
export const complianceCollection = firestore.collection('compliance');
export const reportsCollection = firestore.collection('reports');

// Helper to convert Firestore data to typed object
export function converter<T>() {
  return {
    toFirestore: (data: T) => data,
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => snap.data() as T
  };
}

// Type definitions for Firestore data models
export interface User {
  id?: string;
  username: string;
  password?: string; // Note: In production, you should not store passwords in Firestore
  email: string;
  name?: string;
  plan: string;
  createdAt: Date | string;
}

export interface Scan {
  id?: string;
  userId: string;
  url: string;
  score: number;
  scanDate: Date | string;
  results: any;
  aiAdvice?: string;
  reportUrl?: string;
}

export interface Compliance {
  id?: string;
  userId: string;
  answers: any;
  score: number;
  recommendations?: string;
  createdAt: Date | string;
}

export interface Report {
  id?: string;
  userId: string;
  scanId?: string;
  complianceId?: string;
  reportType: string;
  filePath: string;
  createdAt: Date | string;
}
