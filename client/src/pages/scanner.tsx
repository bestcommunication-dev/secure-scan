import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw, FileText, ShieldAlert, ShieldCheck, AlertTriangle, InfoIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ScoreCircle from '@/components/score-circle';
import SecurityIssue from '@/components/security-issue';
import AIAdvisor from '@/components/ai-advisor';
import VulnerabilityRecommendation from '@/components/vulnerability-recommendation';
import { useAuth } from '@/hooks/use-auth';

const scanFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }).min(1, { message: "URL is required" }),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

const Scanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: '',
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (values: ScanFormValues) => {
      const res = await apiRequest('POST', '/api/scans', values);
      return res.json();
    },
    onSuccess: (data) => {
      setScanResults(data);
      setScanComplete(true);
      queryClient.invalidateQueries({ queryKey: ['/api/scans/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/security'] });
      toast({
        title: "Scan completed",
        description: `Security scan for ${data.url} completed successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/reports/generate/${scanResults.id}`, {
        reportType: 'security',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report generated",
        description: "Your security report has been generated successfully.",
      });
      // Update the scan results with the report URL
      setScanResults({
        ...scanResults,
        reportUrl: data.reportUrl
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Report generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ScanFormValues) => {
    scanMutation.mutate(values);
  };

  const resetScan = () => {
    setScanComplete(false);
    setScanResults(null);
    form.reset();
  };

  const generateReport = () => {
    generateReportMutation.mutate();
  };

  // Helper function to count issues by type
  const countIssuesByType = (type: string) => {
    return scanResults?.results.issues.filter((issue: any) => issue.type === type).length || 0;
  };

  return (
    <div>
      {!scanComplete ? (
        <div className="bg-gray-950 dark:bg-gray-950 text-white py-16 px-4 -mx-4 -mt-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary/90 to-primary text-transparent bg-clip-text">
              Secure Your Website Against Cyber Threats
            </h1>
            <p className="text-lg mb-8 text-gray-300">
              Scan your website for vulnerabilities, get smart AI-powered recommendations, and ensure NIS2 compliance.
            </p>
            
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <FormControl className="flex-grow">
                            <Input 
                              placeholder="Enter your website URL" 
                              className="bg-gray-800 border-gray-700 text-white h-12" 
                              {...field} 
                            />
                          </FormControl>
                          <Button 
                            type="submit" 
                            disabled={scanMutation.isPending} 
                            className="bg-primary hover:bg-primary/90 text-white h-12"
                          >
                            {scanMutation.isPending ? (
                              <span className="flex items-center justify-center">
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Scanning...
                              </span>
                            ) : (
                              'Scan Now'
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
              
              <div className="flex flex-wrap justify-center gap-6 mt-8">
                <div className="flex items-center text-gray-300 text-sm">
                  <ShieldCheck className="h-5 w-5 text-primary mr-2" />
                  <span>100% Secure</span>
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <InfoIcon className="h-5 w-5 text-primary mr-2" />
                  <span>AI Powered</span>
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <span>NIS2 Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Results Overview Card */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Security Scan Results</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  className="bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2"
                  disabled={generateReportMutation.isPending || !!scanResults.reportUrl}
                >
                  {generateReportMutation.isPending ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {scanResults.reportUrl ? 'Download PDF' : 'Download PDF'}
                </Button>
                
                <Button onClick={resetScan} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Rescan
                </Button>
              </div>
            </div>
            
            <p className="text-gray-400 mb-6">{scanResults.url}</p>
            
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col md:flex-row">
                {/* Security Score */}
                <div className="w-full md:w-1/3 flex justify-center items-center mb-8 md:mb-0">
                  <ScoreCircle score={scanResults.score} size={180} strokeWidth={14} colorClass="text-primary" />
                </div>
                
                {/* Stats Summary */}
                <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-500">{countIssuesByType('critical')}</div>
                    <div className="text-sm text-gray-300">Critical Issues</div>
                  </div>
                  <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-yellow-500">{countIssuesByType('warning')}</div>
                    <div className="text-sm text-gray-300">Warnings</div>
                  </div>
                  <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-400">{countIssuesByType('info')}</div>
                    <div className="text-sm text-gray-300">Info</div>
                  </div>
                  <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-500">{scanResults.passedTests || 12}</div>
                    <div className="text-sm text-gray-300">Passed Tests</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Security Issues</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {scanResults.results.issues.length === 0 ? (
                  <div className="p-6 text-center">
                    <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-500">No security issues found!</p>
                    <p className="text-sm text-gray-500 mt-2">Your website passed all security checks.</p>
                  </div>
                ) : (
                  scanResults.results.issues.map((issue: any, index: number) => (
                    <SecurityIssue key={index} issue={issue} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Advisor Section */}
          <AIAdvisor advice={scanResults.aiAdvice} isPremiumUser={user?.plan !== 'Base'} />

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanResults.results.issues
                  .sort((a: any, b: any) => {
                    const typePriority = { critical: 0, warning: 1, info: 2 };
                    return typePriority[a.type as keyof typeof typePriority] - typePriority[b.type as keyof typeof typePriority];
                  })
                  .slice(0, 5)
                  .map((issue: any, index: number) => (
                    <VulnerabilityRecommendation
                      key={index}
                      index={index + 1}
                      type={issue.type}
                      title={`Resolve: ${issue.title}`}
                      description={issue.description}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Report Button */}
          <div className="flex justify-end">
            <Button 
              onClick={generateReport} 
              size="lg" 
              className="px-6 py-3 shadow flex items-center"
              disabled={generateReportMutation.isPending || !!scanResults.reportUrl}
            >
              {generateReportMutation.isPending ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FileText className="mr-2 h-5 w-5" />
              )}
              {scanResults.reportUrl ? 'Report Generated' : 'Generate NIS2 Compliance Report'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
