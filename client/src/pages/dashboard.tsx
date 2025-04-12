import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Shield, AlertCircle, Info, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ScoreCircle from '@/components/score-circle';
import { useAuth } from '@/hooks/use-auth';

const Dashboard = () => {
  const { user } = useAuth();
  
  const { data: recentScans, isLoading: isLoadingScans } = useQuery({ 
    queryKey: ['/api/scans/recent'],
    enabled: !!user,
  });

  const { data: securityStats, isLoading: isLoadingStats } = useQuery({ 
    queryKey: ['/api/stats/security'],
    enabled: !!user,
  });

  const { data: complianceScore, isLoading: isLoadingCompliance } = useQuery({ 
    queryKey: ['/api/stats/compliance'],
    enabled: !!user,
  });

  // Default stats if data is still loading
  const stats = securityStats || {
    score: 70,
    critical: 2,
    warnings: 3,
    passed: 12
  };

  const compliance = complianceScore || {
    score: 50,
    status: 'In Progress'
  };

  const scans = recentScans || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor your website security and compliance status</p>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Security Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Overall Security</CardTitle>
              <Badge variant="outline">Last scan: {isLoadingScans ? 'Loading...' : scans.length > 0 ? new Date(scans[0]?.scanDate).toLocaleDateString() : 'No scans'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center my-2">
              <ScoreCircle score={stats.score} size={128} />
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{stats.critical}</div>
                <div className="text-red-500">Critical</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats.warnings}</div>
                <div className="text-yellow-500">Warnings</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats.passed}</div>
                <div className="text-green-500">Passed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">NIS2 Compliance</CardTitle>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{compliance.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center my-2">
              <ScoreCircle 
                score={compliance.score} 
                size={128} 
                colorClass={compliance.score >= 80 ? 'text-green-500' : (compliance.score >= 60 ? 'text-yellow-500' : 'text-red-500')}
              />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete your NIS2 compliance assessment to improve your score.
              </p>
              <Button className="mt-2 w-full bg-amber-500 hover:bg-amber-600">
                Continue Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Advisor */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">AI Security Advisor</CardTitle>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Premium Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized security recommendations from our AI advisor.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingScans ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading recent scans...</TableCell>
                </TableRow>
              ) : scans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No scan data available. Try scanning a website.</TableCell>
                </TableRow>
              ) : (
                scans.map((scan: any) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.url}</TableCell>
                    <TableCell>{new Date(scan.scanDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={
                        scan.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        scan.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }>
                        {scan.score}/100
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {scan.results.issues.filter((i: any) => i.type === 'critical').length} critical, 
                      {scan.results.issues.filter((i: any) => i.type === 'warning').length} warnings
                    </TableCell>
                    <TableCell>
                      {scan.reportUrl ? (
                        <Link to={`/reports/${scan.id}`} className="text-primary hover:text-primary-dark">View PDF</Link>
                      ) : (
                        <Link to={`/reports/generate/${scan.id}`} className="text-primary hover:text-primary-dark">Generate</Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t">
          <Link href="/scanner" className="text-sm text-primary hover:text-primary-dark">View all scans →</Link>
        </CardFooter>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium">1</span>
              </div>
              <div>
                <h4 className="text-sm font-medium">Scan your website</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start by scanning your website using our security scanner tool.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium">2</span>
              </div>
              <div>
                <h4 className="text-sm font-medium">Review your results</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyze the security issues found and understand their impact.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium">3</span>
              </div>
              <div>
                <h4 className="text-sm font-medium">Complete NIS2 assessment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Take the compliance assessment to check your NIS2 conformity.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium">4</span>
              </div>
              <div>
                <h4 className="text-sm font-medium">Generate reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create PDF reports to document your security status and progress.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
