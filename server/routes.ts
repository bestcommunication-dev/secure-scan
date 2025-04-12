import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { scanWebsite } from "./services/scanner";
import { getSecurityRecommendations, getComplianceRecommendations, askQuestion } from "./services/openai";
import { generateSecurityReport, generateComplianceReport } from "./services/pdf-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      // Create new user
      const user = await storage.createUser({
        username,
        password, // In a real app, you would hash this password
        email,
        name: name || username,
        plan: "Base"
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check password
      if (user.password !== password) { // In a real app, you would verify the hash
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  app.post('/api/user/plan', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { plan } = req.body;
      if (!plan || !['base', 'premium', 'pro'].includes(plan.toLowerCase())) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      
      // Update user plan
      const updatedUser = await storage.updateUserPlan(userId, plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase());
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update plan error:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Scanner routes
  app.post('/api/scans', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Get user to check plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check scan limits based on plan
      const scanCount = await storage.getUserScanCount(userId);
      const scanLimits = {
        "Base": 3,
        "Premium": 10,
        "Pro": Number.POSITIVE_INFINITY
      };
      
      if (scanCount >= scanLimits[user.plan as keyof typeof scanLimits]) {
        return res.status(403).json({ 
          message: `You've reached your monthly scan limit for the ${user.plan} plan. Please upgrade to continue scanning.`
        });
      }
      
      // Perform scan
      const scanResults = await scanWebsite(url);
      
      // Get AI recommendations if premium or pro plan
      let aiAdvice = null;
      if (user.plan === 'Premium' || user.plan === 'Pro') {
        aiAdvice = await getSecurityRecommendations(scanResults);
      }
      
      // Save scan results
      const scan = await storage.createScan({
        userId,
        url,
        score: scanResults.score,
        results: scanResults,
        aiAdvice
      });
      
      res.status(200).json(scan);
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ message: "Failed to scan website" });
    }
  });

  app.get('/api/scans', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const scans = await storage.getUserScans(userId);
      res.status(200).json(scans);
    } catch (error) {
      console.error("Get scans error:", error);
      res.status(500).json({ message: "Failed to get scans" });
    }
  });

  app.get('/api/scans/recent', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const scans = await storage.getUserScans(userId, 3); // Get 3 most recent scans
      res.status(200).json(scans);
    } catch (error) {
      console.error("Get recent scans error:", error);
      res.status(500).json({ message: "Failed to get recent scans" });
    }
  });

  app.get('/api/scans/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const scanId = parseInt(req.params.id);
      if (isNaN(scanId)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const scan = await storage.getScan(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      if (scan.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this scan" });
      }
      
      res.status(200).json(scan);
    } catch (error) {
      console.error("Get scan error:", error);
      res.status(500).json({ message: "Failed to get scan" });
    }
  });

  // AI routes
  app.post('/api/ai/security-advice', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check user plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.plan === 'Base') {
        return res.status(403).json({ message: "AI advisor is available only to Premium and Pro plans" });
      }
      
      const { scanResults } = req.body;
      if (!scanResults) {
        return res.status(400).json({ message: "Scan results are required" });
      }
      
      const advice = await getSecurityRecommendations(scanResults);
      res.status(200).json({ advice });
    } catch (error) {
      console.error("AI security advice error:", error);
      res.status(500).json({ message: "Failed to get AI security advice" });
    }
  });

  app.post('/api/ai/compliance-advice', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check user plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.plan === 'Base') {
        return res.status(403).json({ message: "AI advisor is available only to Premium and Pro plans" });
      }
      
      const { answers } = req.body;
      if (!answers) {
        return res.status(400).json({ message: "Compliance assessment answers are required" });
      }
      
      const advice = await getComplianceRecommendations(answers);
      res.status(200).json({ advice });
    } catch (error) {
      console.error("AI compliance advice error:", error);
      res.status(500).json({ message: "Failed to get AI compliance advice" });
    }
  });

  app.post('/api/ai/ask', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check user plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.plan === 'Base') {
        return res.status(403).json({ message: "AI advisor is available only to Premium and Pro plans" });
      }
      
      const { question, context } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const response = await askQuestion(question, context);
      res.status(200).json({ response });
    } catch (error) {
      console.error("AI ask error:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // Compliance routes
  app.post('/api/compliance', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Valid answers array is required" });
      }
      
      // Calculate compliance score based on answers
      const score = calculateComplianceScore(answers);
      
      // Get AI recommendations if premium or pro plan
      const user = await storage.getUser(userId);
      let recommendations = null;
      if (user && (user.plan === 'Premium' || user.plan === 'Pro')) {
        recommendations = await getComplianceRecommendations(answers);
      }
      
      // Save compliance assessment
      const compliance = await storage.createCompliance({
        userId,
        answers,
        score,
        recommendations
      });
      
      res.status(200).json({
        ...compliance,
        // Add some additional computed fields for the frontend
        strengths: getComplianceStrengths(answers),
        improvementAreas: getComplianceImprovementAreas(answers),
        shortTermActions: getShortTermActions(answers),
        mediumTermActions: getMediumTermActions(answers),
        longTermActions: getLongTermActions(answers)
      });
    } catch (error) {
      console.error("Compliance assessment error:", error);
      res.status(500).json({ message: "Failed to process compliance assessment" });
    }
  });

  app.get('/api/compliance/latest', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const compliance = await storage.getLatestCompliance(userId);
      
      if (!compliance) {
        return res.status(404).json({ message: "No compliance assessment found" });
      }
      
      res.status(200).json({
        ...compliance,
        // Add some additional computed fields for the frontend
        strengths: getComplianceStrengths(compliance.answers),
        improvementAreas: getComplianceImprovementAreas(compliance.answers),
        shortTermActions: getShortTermActions(compliance.answers),
        mediumTermActions: getMediumTermActions(compliance.answers),
        longTermActions: getLongTermActions(compliance.answers)
      });
    } catch (error) {
      console.error("Get latest compliance error:", error);
      res.status(500).json({ message: "Failed to get latest compliance assessment" });
    }
  });

  // Report routes
  app.post('/api/reports/generate', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { scanId, complianceId, reportType, includeDetails, includeAI, includeRemediation } = req.body;
      
      if (!reportType || !['security', 'nis2', 'comprehensive'].includes(reportType)) {
        return res.status(400).json({ message: "Valid report type is required" });
      }
      
      // Check if comprehensive report is allowed based on plan
      if (reportType === 'comprehensive') {
        const user = await storage.getUser(userId);
        if (!user || (user.plan !== 'Premium' && user.plan !== 'Pro')) {
          return res.status(403).json({ message: "Comprehensive reports are available only to Premium and Pro plans" });
        }
      }
      
      let filePath = '';
      let scan = null;
      let compliance = null;
      
      // Generate appropriate report
      if (reportType === 'security' || reportType === 'comprehensive') {
        if (!scanId) {
          return res.status(400).json({ message: "Scan ID is required for security reports" });
        }
        
        scan = await storage.getScan(parseInt(scanId));
        
        if (!scan) {
          return res.status(404).json({ message: "Scan not found" });
        }
        
        if (scan.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to access this scan" });
        }
        
        const options = {
          includeDetails: includeDetails !== false,
          includeAI: includeAI !== false,
          includeRemediation: includeRemediation !== false
        };
        
        filePath = await generateSecurityReport(scan, options);
      }
      
      if (reportType === 'nis2' || reportType === 'comprehensive') {
        let complianceData;
        
        if (complianceId) {
          complianceData = await storage.getCompliance(parseInt(complianceId));
        } else {
          complianceData = await storage.getLatestCompliance(userId);
        }
        
        if (!complianceData) {
          return res.status(404).json({ message: "Compliance assessment not found" });
        }
        
        if (complianceData.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to access this compliance assessment" });
        }
        
        compliance = complianceData;
        
        if (reportType === 'nis2') {
          const options = {
            includeDetails: includeDetails !== false,
            includeAI: includeAI !== false,
            includeRemediation: includeRemediation !== false
          };
          
          filePath = await generateComplianceReport(compliance, options);
        }
      }
      
      if (reportType === 'comprehensive') {
        // For comprehensive reports, we need both scan and compliance data
        // We already fetched them above based on the IDs provided
        if (!scan || !compliance) {
          return res.status(400).json({ 
            message: "Both scan and compliance assessment are required for comprehensive reports" 
          });
        }
        
        // Generate comprehensive report with both scan and compliance data
        // This would be implemented in the pdf-generator service
        const options = {
          includeDetails: includeDetails !== false,
          includeAI: includeAI !== false,
          includeRemediation: includeRemediation !== false
        };
        
        // Use security report generator for now, would be replaced with comprehensive report generator
        filePath = await generateSecurityReport(scan, options, compliance);
      }
      
      // Save report reference
      const report = await storage.createReport({
        userId,
        scanId: scan?.id,
        complianceId: compliance?.id,
        reportType,
        filePath
      });
      
      // Update scan with report URL if it's a security report
      if (scan && (reportType === 'security' || reportType === 'comprehensive')) {
        await storage.updateScanReport(scan.id, filePath);
      }
      
      res.status(200).json({
        ...report,
        reportUrl: filePath
      });
    } catch (error) {
      console.error("Generate report error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get('/api/reports', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const reports = await storage.getUserReports(userId);
      res.status(200).json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  // Statistics routes
  app.get('/api/stats/security', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get latest scan or default stats
      const latestScan = await storage.getLatestScan(userId);
      
      if (!latestScan) {
        return res.status(200).json({
          score: 0,
          critical: 0,
          warnings: 0,
          passed: 0
        });
      }
      
      // Count issues by type
      const critical = latestScan.results.issues.filter((issue: any) => issue.type === 'critical').length;
      const warnings = latestScan.results.issues.filter((issue: any) => issue.type === 'warning').length;
      const infos = latestScan.results.issues.filter((issue: any) => issue.type === 'info').length;
      
      // Calculate passed tests (this is an estimate)
      const totalChecks = 18; // Typical number of security checks
      const passed = totalChecks - (critical + warnings + infos);
      
      res.status(200).json({
        score: latestScan.score,
        critical,
        warnings,
        infos,
        passed
      });
    } catch (error) {
      console.error("Get security stats error:", error);
      res.status(500).json({ message: "Failed to get security statistics" });
    }
  });

  app.get('/api/stats/compliance', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get latest compliance assessment or default stats
      const latestCompliance = await storage.getLatestCompliance(userId);
      
      if (!latestCompliance) {
        return res.status(200).json({
          score: 0,
          status: 'Not Started'
        });
      }
      
      // Determine status based on score
      let status = 'In Progress';
      if (latestCompliance.score >= 80) {
        status = 'Compliant';
      } else if (latestCompliance.score >= 40) {
        status = 'Partially Compliant';
      } else {
        status = 'Non-Compliant';
      }
      
      res.status(200).json({
        score: latestCompliance.score,
        status
      });
    } catch (error) {
      console.error("Get compliance stats error:", error);
      res.status(500).json({ message: "Failed to get compliance statistics" });
    }
  });

  // Helper functions for compliance assessment
  function calculateComplianceScore(answers: any[]): number {
    // Simple scoring: "Yes, fully implemented" = 100%, "Partially implemented" = 66%, "In planning" = 33%, "No" = 0%
    // Then average all scores
    const scoreMap: { [key: string]: number } = {
      "Yes, fully implemented": 100,
      "Partially implemented": 66,
      "In planning": 33,
      "No": 0
    };
    
    const totalScore = answers.reduce((sum, answer) => {
      return sum + (scoreMap[answer.answer] || 0);
    }, 0);
    
    return Math.round(totalScore / answers.length);
  }

  function getComplianceStrengths(answers: any[]): string[] {
    // Return areas where the answer is "Yes, fully implemented"
    return answers
      .filter(answer => answer.answer === "Yes, fully implemented")
      .map(answer => {
        // Map answer to a strength description
        const questionId = typeof answer.questionId === 'number' ? answer.questionId : parseInt(answer.questionId);
        switch (questionId) {
          case 1: return "Information security policy in place";
          case 2: return "Supply chain security measures implemented";
          case 3: return "Vulnerability handling processes established";
          case 4: return "Access control and identity management policies";
          case 5: return "Incident response procedures implemented";
          default: return `Strength in area ${answer.questionId}`;
        }
      });
  }

  function getComplianceImprovementAreas(answers: any[]): string[] {
    // Return areas where the answer is "No" or "In planning"
    return answers
      .filter(answer => answer.answer === "No" || answer.answer === "In planning")
      .map(answer => {
        // Map answer to an improvement area description
        const questionId = typeof answer.questionId === 'number' ? answer.questionId : parseInt(answer.questionId);
        switch (questionId) {
          case 1: return "Formal information security policy";
          case 2: return "Supply chain security measures";
          case 3: return "Vulnerability handling processes";
          case 4: return "Access control and identity management";
          case 5: return "Incident response procedures";
          default: return `Improvement needed in area ${answer.questionId}`;
        }
      });
  }

  function getShortTermActions(answers: any[]): string[] {
    // Return short-term actions for areas with "No" answers
    return answers
      .filter(answer => answer.answer === "No")
      .map(answer => {
        const questionId = typeof answer.questionId === 'number' ? answer.questionId : parseInt(answer.questionId);
        switch (questionId) {
          case 1: return "Develop a basic information security policy document";
          case 2: return "Create an inventory of critical suppliers";
          case 3: return "Implement basic vulnerability scanning on critical systems";
          case 4: return "Review and document current access control practices";
          case 5: return "Create a simple incident response plan template";
          default: return `Address gap in area ${answer.questionId}`;
        }
      });
  }

  function getMediumTermActions(answers: any[]): string[] {
    // Return medium-term actions for areas with "In planning" or "Partially implemented" answers
    return answers
      .filter(answer => answer.answer === "In planning" || answer.answer === "Partially implemented")
      .map(answer => {
        const questionId = typeof answer.questionId === 'number' ? answer.questionId : parseInt(answer.questionId);
        switch (questionId) {
          case 1: return "Align security policy with NIS2 requirements and get management approval";
          case 2: return "Develop formal supply chain risk assessment procedures";
          case 3: return "Establish a structured vulnerability disclosure process";
          case 4: return "Implement role-based access control across all systems";
          case 5: return "Test and refine incident response procedures";
          default: return `Enhance capabilities in area ${answer.questionId}`;
        }
      });
  }

  function getLongTermActions(answers: any[]): string[] {
    // Return long-term strategic actions
    const weakAreas = answers
      .filter(answer => answer.answer !== "Yes, fully implemented")
      .map(answer => parseInt(answer.questionId.toString()));
    
    const actions = [
      "Implement a comprehensive security monitoring and threat detection system",
      "Conduct regular third-party security assessments",
      "Develop a holistic NIS2 compliance program with regular reviews"
    ];
    
    if (weakAreas.includes(1)) {
      actions.push("Integrate security policy into organization-wide governance framework");
    }
    
    if (weakAreas.includes(2)) {
      actions.push("Establish continuous supply chain security monitoring and assessment");
    }
    
    if (weakAreas.includes(3)) {
      actions.push("Build a mature vulnerability management program with automated workflows");
    }
    
    return actions.slice(0, 3); // Return at most 3 actions
  }

  const httpServer = createServer(app);
  return httpServer;
}
