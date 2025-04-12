import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, FileText, ShieldCheck, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ScoreCircle from '@/components/score-circle';
import AIAdvisor from '@/components/ai-advisor';
import { useAuth } from '@/hooks/use-auth';

// NIS2 compliance questions
const complianceQuestions = [
  { 
    id: 1, 
    question: 'Does your organization have a formal information security policy that addresses NIS2 requirements?', 
    options: ['Yes, fully implemented', 'Partially implemented', 'In planning', 'No'] 
  },
  { 
    id: 2, 
    question: 'Do you have measures in place to address supply chain security risks?', 
    options: ['Yes, fully implemented', 'Partially implemented', 'In planning', 'No'] 
  },
  { 
    id: 3, 
    question: 'Has your organization implemented vulnerability handling and disclosure processes?', 
    options: ['Yes, fully implemented', 'Partially implemented', 'In planning', 'No'] 
  },
  { 
    id: 4, 
    question: 'Do you have security policies for access control and identity management?', 
    options: ['Yes, fully implemented', 'Partially implemented', 'In planning', 'No'] 
  },
  { 
    id: 5, 
    question: 'Has your organization implemented incident response procedures?', 
    options: ['Yes, fully implemented', 'Partially implemented', 'In planning', 'No'] 
  }
];

const Compliance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  
  // Fetch user's latest compliance assessment if it exists
  const { data: complianceData, isLoading: isLoadingCompliance } = useQuery({ 
    queryKey: ['/api/compliance/latest'],
    enabled: !!user,
  });

  const progress = Math.round((activeQuestion / complianceQuestions.length) * 100);

  const submitComplianceMutation = useMutation({
    mutationFn: async (answers: Record<number, number>) => {
      const formattedAnswers = Object.entries(answers).map(([questionId, answerIndex]) => ({
        questionId: parseInt(questionId),
        answer: complianceQuestions[parseInt(questionId) - 1].options[answerIndex]
      }));
      
      const res = await apiRequest('POST', '/api/compliance', { answers: formattedAnswers });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment submitted",
        description: "Your NIS2 compliance assessment has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/compliance'] });
      setShowResults(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/reports/generate', {
        reportType: 'nis2',
        complianceId: complianceData.id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report generated",
        description: "Your NIS2 compliance report has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Report generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [complianceQuestions[activeQuestion].id]: parseInt(value)
    });
  };

  const goToNextQuestion = () => {
    if (activeQuestion < complianceQuestions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    }
  };

  const submitAssessment = () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < complianceQuestions.length) {
      toast({
        title: "Incomplete assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    submitComplianceMutation.mutate(answers);
  };

  const startNewAssessment = () => {
    setAnswers({});
    setActiveQuestion(0);
    setShowResults(false);
  };

  if (isLoadingCompliance) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading compliance data...</span>
      </div>
    );
  }

  // If user has a completed assessment and we're not starting a new one
  const hasCompletedAssessment = complianceData && !showResults && Object.keys(answers).length === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">NIS2 Compliance</h1>
        <p className="text-gray-600 dark:text-gray-400">Assess your compliance with the NIS2 Directive requirements</p>
      </div>

      {/* NIS2 Overview Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>NIS2 Directive Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The NIS2 Directive is a European cybersecurity legislation that aims to enhance the overall level of cybersecurity in the EU. 
            It requires organizations in critical sectors to implement appropriate security measures and report significant incidents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Key Requirements</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Risk management measures</li>
                <li>Incident handling procedures</li>
                <li>Business continuity planning</li>
                <li>Supply chain security</li>
                <li>Vulnerability disclosure</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Scope & Applicability</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Essential entities in critical sectors</li>
                <li>Important entities in additional sectors</li>
                <li>Public and private organizations</li>
                <li>Organizations exceeding size thresholds</li>
                <li>Digital service providers</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Timeline</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Adopted: January 2023</li>
                <li>Entered into force: January 2023</li>
                <li>Member state implementation: October 2024</li>
                <li>Organization compliance: Early 2025</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasCompletedAssessment ? (
        // Show previous assessment results
        <div className="space-y-8">
          {/* Results Overview Card */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Compliance Assessment Results</CardTitle>
                <Button onClick={startNewAssessment}>Start New Assessment</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row">
                {/* Compliance Score */}
                <div className="w-full md:w-1/3 flex justify-center items-center mb-6 md:mb-0">
                  <ScoreCircle 
                    score={complianceData.score} 
                    size={160} 
                    strokeWidth={12} 
                    colorClass={
                      complianceData.score >= 80 ? 'text-green-500' : 
                      complianceData.score >= 60 ? 'text-yellow-500' : 
                      'text-red-500'
                    }
                  />
                </div>
                
                {/* Compliance Summary */}
                <div className="w-full md:w-2/3">
                  <h3 className="text-lg font-medium mb-3">Summary</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {complianceData.score >= 80 
                      ? 'Your organization is well-compliant with the NIS2 Directive requirements. Continue to maintain and improve your security posture.'
                      : complianceData.score >= 60
                      ? 'Your organization is partially compliant with the NIS2 Directive requirements. To improve your compliance level, focus on the areas highlighted in the recommendations below.'
                      : 'Your organization has significant gaps in NIS2 compliance. Immediate action is recommended in several areas as detailed below.'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                        {complianceData.strengths?.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        )) || (
                          <>
                            <li>Information security policy in place</li>
                            <li>Incident response procedures implemented</li>
                            <li>Basic access control mechanisms</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Improvement Areas</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                        {complianceData.improvementAreas?.map((area: string, index: number) => (
                          <li key={index}>{area}</li>
                        )) || (
                          <>
                            <li>Supply chain security measures</li>
                            <li>Vulnerability handling processes</li>
                            <li>Business continuity planning</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <AIAdvisor 
            advice={complianceData.recommendations} 
            isPremiumUser={user?.plan !== 'Base'} 
            title="AI Compliance Recommendations"
          />

          {/* Compliance Improvement Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Improvement Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-medium">Short-term Actions (1-3 months)</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {complianceData.shortTermActions?.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 text-yellow-500 mr-2"><AlertTriangle className="h-5 w-5" /></span>
                        <span>{action}</span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-yellow-500 mr-2"><AlertTriangle className="h-5 w-5" /></span>
                          <span>Formalize and document your existing incident response procedures</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-yellow-500 mr-2"><AlertTriangle className="h-5 w-5" /></span>
                          <span>Implement basic vulnerability scanning on critical systems</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium">Medium-term Actions (3-6 months)</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {complianceData.mediumTermActions?.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 text-blue-500 mr-2"><Info className="h-5 w-5" /></span>
                        <span>{action}</span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-blue-500 mr-2"><Info className="h-5 w-5" /></span>
                          <span>Develop a formal supply chain security assessment process</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-blue-500 mr-2"><Info className="h-5 w-5" /></span>
                          <span>Create business continuity and disaster recovery plans</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium">Long-term Actions (6-12 months)</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {complianceData.longTermActions?.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 text-green-500 mr-2"><CheckCircle className="h-5 w-5" /></span>
                        <span>{action}</span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-green-500 mr-2"><CheckCircle className="h-5 w-5" /></span>
                          <span>Implement comprehensive security monitoring and threat detection</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-5 w-5 text-green-500 mr-2"><CheckCircle className="h-5 w-5" /></span>
                          <span>Conduct regular third-party security assessments</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={() => generateReportMutation.mutate()} 
                  disabled={generateReportMutation.isPending}
                  className="flex items-center"
                >
                  {generateReportMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional Support Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Professional Support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our team of NIS2 compliance experts can provide personalized guidance to help your organization meet all regulatory requirements.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Compliance Consultation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get a detailed assessment of your NIS2 compliance status and a customized roadmap for improvement.
                  </p>
                  <Button className="w-full">
                    Schedule Consultation
                  </Button>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Document Template Package</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Access a comprehensive set of NIS2-compliant policy and procedure templates customized for your organization.
                  </p>
                  <Button className="w-full">
                    Get Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : showResults ? (
        // Showing results for the assessment just completed
        <div className="space-y-8">
          {/* Results Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Assessment Results</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row">
                {/* Compliance Score */}
                <div className="w-full md:w-1/3 flex justify-center items-center mb-6 md:mb-0">
                  <ScoreCircle 
                    score={complianceData?.score || 65} 
                    size={160} 
                    strokeWidth={12} 
                    colorClass={
                      (complianceData?.score || 65) >= 80 ? 'text-green-500' : 
                      (complianceData?.score || 65) >= 60 ? 'text-yellow-500' : 
                      'text-red-500'
                    }
                  />
                </div>
                
                {/* Compliance Summary */}
                <div className="w-full md:w-2/3">
                  <h3 className="text-lg font-medium mb-3">Summary</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your organization is partially compliant with the NIS2 Directive requirements. To improve your compliance level, focus on the areas highlighted in the recommendations below.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                        <li>Information security policy in place</li>
                        <li>Incident response procedures implemented</li>
                        <li>Basic access control mechanisms</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Improvement Areas</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                        <li>Supply chain security measures</li>
                        <li>Vulnerability handling processes</li>
                        <li>Business continuity planning</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <AIAdvisor 
            advice={complianceData?.recommendations || "Based on your assessment, I recommend focusing on these key areas to improve your NIS2 compliance: 1) Supply Chain Security: Develop a formal supply chain risk management program that includes vendor assessment, contractual security requirements, and regular audits. 2) Vulnerability Management: Establish a structured vulnerability disclosure process, implement regular vulnerability scanning, and develop clear remediation timeframes. 3) Business Continuity: Create comprehensive business continuity and disaster recovery plans, test them regularly, and ensure they meet NIS2 requirements."}
            isPremiumUser={user?.plan !== 'Base'} 
            title="AI Compliance Recommendations"
          />

          {/* Generate Report Button */}
          <div className="flex justify-end">
            <Button 
              onClick={() => generateReportMutation.mutate()} 
              disabled={generateReportMutation.isPending}
              size="lg"
              className="px-6 py-3 shadow flex items-center"
            >
              {generateReportMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FileText className="mr-2 h-5 w-5" />
              )}
              Generate Compliance Report
            </Button>
          </div>
        </div>
      ) : (
        // Compliance Assessment Form
        <Card className="mb-8">
          <CardHeader className="border-b">
            <CardTitle>Compliance Self-Assessment</CardTitle>
            <CardDescription>
              Answer the following questions to assess your organization's NIS2 compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Question {activeQuestion + 1} of {complianceQuestions.length}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>

            {/* Question */}
            {complianceQuestions.map((q, index) => (
              <div key={q.id} className={`space-y-6 ${activeQuestion === index ? 'block' : 'hidden'}`}>
                <div>
                  <h3 className="text-lg font-medium mb-4">{q.question}</h3>
                  <RadioGroup 
                    value={answers[q.id]?.toString() || ""} 
                    onValueChange={handleAnswerChange}
                  >
                    <div className="space-y-3">
                      {q.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center">
                          <RadioGroupItem 
                            value={optIndex.toString()} 
                            id={`q${q.id}_opt${optIndex}`} 
                          />
                          <Label htmlFor={`q${q.id}_opt${optIndex}`} className="ml-2">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={goToPrevQuestion} 
                    disabled={index === 0}
                  >
                    Previous
                  </Button>
                  {index < complianceQuestions.length - 1 ? (
                    <Button 
                      onClick={goToNextQuestion}
                      disabled={answers[q.id] === undefined}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      onClick={submitAssessment}
                      disabled={Object.keys(answers).length < complianceQuestions.length || submitComplianceMutation.isPending}
                    >
                      {submitComplianceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Compliance;
