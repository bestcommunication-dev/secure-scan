import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileText, Download, Eye, Share2 } from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const reportFormSchema = z.object({
  scanId: z.string().min(1, { message: "Please select a website" }),
  reportType: z.enum(["security", "nis2", "comprehensive"]),
  includeDetails: z.boolean().default(true),
  includeAI: z.boolean().default(true),
  includeRemediation: z.boolean().default(true),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's scans
  const { data: scans, isLoading: isLoadingScans } = useQuery({ 
    queryKey: ['/api/scans'],
    enabled: !!user,
  });

  // Fetch user's reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({ 
    queryKey: ['/api/reports'],
    enabled: !!user,
  });

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      scanId: "",
      reportType: "security",
      includeDetails: true,
      includeAI: true,
      includeRemediation: true,
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (values: ReportFormValues) => {
      const res = await apiRequest('POST', '/api/reports/generate', values);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report generated",
        description: "Your report has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Report generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ReportFormValues) => {
    generateReportMutation.mutate(values);
  };

  // Function to check if comprehensive report is available for user's plan
  const isComprehensiveAvailable = () => {
    return user?.plan === 'Premium' || user?.plan === 'Pro';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Security Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">View and generate security assessment reports</p>
      </div>

      {/* Generate New Report Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="scanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Website</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select a scanned website --" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingScans ? (
                          <SelectItem value="" disabled>Loading scans...</SelectItem>
                        ) : !scans || scans.length === 0 ? (
                          <SelectItem value="" disabled>No scans available</SelectItem>
                        ) : (
                          scans.map((scan: any) => (
                            <SelectItem key={scan.id} value={scan.id.toString()}>
                              {scan.url} ({new Date(scan.scanDate).toLocaleDateString()})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="security">Security Assessment Report</SelectItem>
                        <SelectItem value="nis2">NIS2 Compliance Report</SelectItem>
                        <SelectItem 
                          value="comprehensive" 
                          disabled={!isComprehensiveAvailable()}
                        >
                          Comprehensive Report {!isComprehensiveAvailable() && '(Premium/Pro only)'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Report Options</FormLabel>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center">
                    <FormField
                      control={form.control}
                      name="includeDetails"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              id="include-details"
                            />
                          </FormControl>
                          <Label htmlFor="include-details" className="text-sm">
                            Include technical details
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center">
                    <FormField
                      control={form.control}
                      name="includeAI"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              id="include-ai"
                            />
                          </FormControl>
                          <Label htmlFor="include-ai" className="text-sm">
                            Include AI recommendations
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center">
                    <FormField
                      control={form.control}
                      name="includeRemediation"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              id="include-remediation"
                            />
                          </FormControl>
                          <Label htmlFor="include-remediation" className="text-sm">
                            Include remediation steps
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </FormItem>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={generateReportMutation.isPending || isLoadingScans || !scans || scans.length === 0}
                  className="flex items-center"
                >
                  {generateReportMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Report
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingReports ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading reports...</TableCell>
                </TableRow>
              ) : !reports || reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No reports available. Generate a report to see it here.</TableCell>
                </TableRow>
              ) : (
                reports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.scanUrl || report.url} - {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report
                    </TableCell>
                    <TableCell>
                      {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Ready
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-3">
                        <a href={report.filePath} className="text-primary hover:text-primary-dark" download>
                          Download
                        </a>
                        <a href={report.filePath} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          Share
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
