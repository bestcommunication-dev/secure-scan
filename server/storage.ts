import { 
  users, 
  scans, 
  compliance, 
  reports,
  type User, 
  type InsertUser, 
  type Scan, 
  type InsertScan, 
  type Compliance, 
  type InsertCompliance, 
  type Report,  
  type InsertReport 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(id: number, plan: string): Promise<User>;
  
  // Scan operations
  getScan(id: number): Promise<Scan | undefined>;
  getLatestScan(userId: number): Promise<Scan | undefined>;
  getUserScans(userId: number, limit?: number): Promise<Scan[]>;
  getUserScanCount(userId: number): Promise<number>;
  createScan(scan: InsertScan): Promise<Scan>;
  updateScanReport(scanId: number, reportUrl: string): Promise<void>;
  
  // Compliance operations
  getCompliance(id: number): Promise<Compliance | undefined>;
  getLatestCompliance(userId: number): Promise<Compliance | undefined>;
  createCompliance(compliance: InsertCompliance): Promise<Compliance>;
  
  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getUserReports(userId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private complianceAssessments: Map<number, Compliance>;
  private reportsData: Map<number, Report>;
  private currentUserId: number;
  private currentScanId: number;
  private currentComplianceId: number;
  private currentReportId: number;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.complianceAssessments = new Map();
    this.reportsData = new Map();
    this.currentUserId = 1;
    this.currentScanId = 1;
    this.currentComplianceId = 1;
    this.currentReportId = 1;
    
    // Add demo user
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Demo User",
      plan: "Base"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUserPlan(id: number, plan: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    user.plan = plan;
    this.users.set(id, user);
    return user;
  }

  // Scan operations
  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getLatestScan(userId: number): Promise<Scan | undefined> {
    const userScans = Array.from(this.scans.values())
      .filter(scan => scan.userId === userId)
      .sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());
    
    return userScans.length > 0 ? userScans[0] : undefined;
  }

  async getUserScans(userId: number, limit?: number): Promise<Scan[]> {
    const userScans = Array.from(this.scans.values())
      .filter(scan => scan.userId === userId)
      .sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());
    
    return limit ? userScans.slice(0, limit) : userScans;
  }

  async getUserScanCount(userId: number): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const scansThisMonth = Array.from(this.scans.values())
      .filter(scan => scan.userId === userId && new Date(scan.scanDate) >= firstDayOfMonth);
    
    return scansThisMonth.length;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.currentScanId++;
    const scanDate = new Date();
    const scan: Scan = { ...insertScan, id, scanDate, reportUrl: null };
    this.scans.set(id, scan);
    return scan;
  }

  async updateScanReport(scanId: number, reportUrl: string): Promise<void> {
    const scan = await this.getScan(scanId);
    if (!scan) {
      throw new Error(`Scan with ID ${scanId} not found`);
    }
    
    scan.reportUrl = reportUrl;
    this.scans.set(scanId, scan);
  }

  // Compliance operations
  async getCompliance(id: number): Promise<Compliance | undefined> {
    return this.complianceAssessments.get(id);
  }

  async getLatestCompliance(userId: number): Promise<Compliance | undefined> {
    const userCompliance = Array.from(this.complianceAssessments.values())
      .filter(comp => comp.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userCompliance.length > 0 ? userCompliance[0] : undefined;
  }

  async createCompliance(insertCompliance: InsertCompliance): Promise<Compliance> {
    const id = this.currentComplianceId++;
    const createdAt = new Date();
    const compliance: Compliance = { ...insertCompliance, id, createdAt };
    this.complianceAssessments.set(id, compliance);
    return compliance;
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reportsData.get(id);
  }

  async getUserReports(userId: number): Promise<Report[]> {
    return Array.from(this.reportsData.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const createdAt = new Date();
    const report: Report = { ...insertReport, id, createdAt };
    this.reportsData.set(id, report);
    return report;
  }
}

// Import FirestoreStorage implementation
import { FirestoreStorage } from './firestore-storage';

// Export storage instance
// Use FirestoreStorage for production and MemStorage for development/testing
export const storage = process.env.NODE_ENV === 'production' 
  ? new FirestoreStorage() 
  : new MemStorage();
