import { 
  usersCollection, 
  scansCollection, 
  complianceCollection, 
  reportsCollection,
  type User,
  type Scan,
  type Compliance,
  type Report
} from './firestore';
import { IStorage } from './storage';

// Firestore implementation of the storage interface
export class FirestoreStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const userDoc = await usersCollection.doc(id.toString()).get();
    if (!userDoc.exists) return undefined;
    return { id: parseInt(userDoc.id), ...userDoc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const querySnapshot = await usersCollection
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();
    
    if (querySnapshot.empty) return undefined;
    
    const userDoc = querySnapshot.docs[0];
    return { id: parseInt(userDoc.id), ...userDoc.data() } as User;
  }

  async createUser(user: any): Promise<User> {
    // Generate a new ID
    const newUserRef = usersCollection.doc();
    const id = parseInt(newUserRef.id);
    
    const userData: User = {
      ...user,
      username: user.username.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    
    await newUserRef.set(userData);
    return { id, ...userData };
  }

  async updateUserPlan(id: number, plan: string): Promise<User> {
    const userRef = usersCollection.doc(id.toString());
    await userRef.update({ plan });
    
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return { id, ...userDoc.data() } as User;
  }
  
  // Scan operations
  async getScan(id: number): Promise<Scan | undefined> {
    const scanDoc = await scansCollection.doc(id.toString()).get();
    if (!scanDoc.exists) return undefined;
    return { id: parseInt(scanDoc.id), ...scanDoc.data() } as Scan;
  }

  async getLatestScan(userId: number): Promise<Scan | undefined> {
    const querySnapshot = await scansCollection
      .where('userId', '==', userId.toString())
      .orderBy('scanDate', 'desc')
      .limit(1)
      .get();
    
    if (querySnapshot.empty) return undefined;
    
    const scanDoc = querySnapshot.docs[0];
    return { id: parseInt(scanDoc.id), ...scanDoc.data() } as Scan;
  }

  async getUserScans(userId: number, limit?: number): Promise<Scan[]> {
    let query = scansCollection
      .where('userId', '==', userId.toString())
      .orderBy('scanDate', 'desc');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const querySnapshot = await query.get();
    
    return querySnapshot.docs.map(doc => ({ 
      id: parseInt(doc.id), 
      ...doc.data() 
    })) as Scan[];
  }

  async getUserScanCount(userId: number): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const querySnapshot = await scansCollection
      .where('userId', '==', userId.toString())
      .where('scanDate', '>=', firstDayOfMonth.toISOString())
      .get();
    
    return querySnapshot.size;
  }

  async createScan(scan: any): Promise<Scan> {
    // Generate a new ID
    const newScanRef = scansCollection.doc();
    const id = parseInt(newScanRef.id);
    
    const scanData: Scan = {
      ...scan,
      userId: scan.userId.toString(),
      scanDate: new Date().toISOString(),
      reportUrl: null
    };
    
    await newScanRef.set(scanData);
    return { id, ...scanData };
  }

  async updateScanReport(scanId: number, reportUrl: string): Promise<void> {
    const scanRef = scansCollection.doc(scanId.toString());
    await scanRef.update({ reportUrl });
  }
  
  // Compliance operations
  async getCompliance(id: number): Promise<Compliance | undefined> {
    const complianceDoc = await complianceCollection.doc(id.toString()).get();
    if (!complianceDoc.exists) return undefined;
    return { id: parseInt(complianceDoc.id), ...complianceDoc.data() } as Compliance;
  }

  async getLatestCompliance(userId: number): Promise<Compliance | undefined> {
    const querySnapshot = await complianceCollection
      .where('userId', '==', userId.toString())
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (querySnapshot.empty) return undefined;
    
    const complianceDoc = querySnapshot.docs[0];
    return { id: parseInt(complianceDoc.id), ...complianceDoc.data() } as Compliance;
  }

  async createCompliance(compliance: any): Promise<Compliance> {
    // Generate a new ID
    const newComplianceRef = complianceCollection.doc();
    const id = parseInt(newComplianceRef.id);
    
    const complianceData: Compliance = {
      ...compliance,
      userId: compliance.userId.toString(),
      createdAt: new Date().toISOString()
    };
    
    await newComplianceRef.set(complianceData);
    return { id, ...complianceData };
  }
  
  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    const reportDoc = await reportsCollection.doc(id.toString()).get();
    if (!reportDoc.exists) return undefined;
    return { id: parseInt(reportDoc.id), ...reportDoc.data() } as Report;
  }

  async getUserReports(userId: number): Promise<Report[]> {
    const querySnapshot = await reportsCollection
      .where('userId', '==', userId.toString())
      .orderBy('createdAt', 'desc')
      .get();
    
    return querySnapshot.docs.map(doc => ({ 
      id: parseInt(doc.id), 
      ...doc.data() 
    })) as Report[];
  }

  async createReport(report: any): Promise<Report> {
    // Generate a new ID
    const newReportRef = reportsCollection.doc();
    const id = parseInt(newReportRef.id);
    
    const reportData: Report = {
      ...report,
      userId: report.userId.toString(),
      scanId: report.scanId ? report.scanId.toString() : null,
      complianceId: report.complianceId ? report.complianceId.toString() : null,
      createdAt: new Date().toISOString()
    };
    
    await newReportRef.set(reportData);
    return { id, ...reportData };
  }
}
