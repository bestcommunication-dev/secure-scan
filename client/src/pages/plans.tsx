import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PlanCard from '@/components/plan-card';
import { useAuth } from '@/hooks/use-auth';

// Plan data
const plans = [
  {
    id: 'base',
    name: 'Base',
    price: 29,
    description: 'For small websites with basic security needs',
    scansPerMonth: 3,
    features: [
      { name: 'website scans per month', value: '3', included: true },
      { name: 'Basic security assessment', included: true },
      { name: 'PDF security reports', included: true },
      { name: 'NIS2 compliance assessment', included: true },
      { name: 'AI security advisor', included: false },
      { name: 'Advanced vulnerability detection', included: false },
      { name: 'Email notifications', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    description: 'For businesses with growing security requirements',
    scansPerMonth: 10,
    recommended: true,
    features: [
      { name: 'website scans per month', value: '10', included: true, highlight: true },
      { name: 'Comprehensive security assessment', included: true },
      { name: 'Detailed PDF security reports', included: true },
      { name: 'Full NIS2 compliance toolset', included: true },
      { name: 'AI security advisor with recommendations', included: true, highlight: true },
      { name: 'Advanced vulnerability detection', included: true },
      { name: 'Email notifications', included: true },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'For enterprises with advanced security needs',
    scansPerMonth: 'Unlimited',
    features: [
      { name: 'website scans per month', value: 'Unlimited', included: true, highlight: true },
      { name: 'Enterprise-grade security assessment', included: true },
      { name: 'White-labeled PDF reports', included: true },
      { name: 'Complete NIS2 compliance suite', included: true },
      { name: 'Unlimited AI security consultations', included: true, highlight: true },
      { name: 'Premium vulnerability detection', included: true },
      { name: 'Priority email & phone support', included: true },
    ]
  }
];

// Feature comparison data
const featureComparison = [
  { feature: 'Monthly scans', base: '3', premium: '10', pro: 'Unlimited' },
  { feature: 'HTTPS security check', base: true, premium: true, pro: true },
  { feature: 'Security headers analysis', base: true, premium: true, pro: true },
  { feature: 'CMS detection', base: true, premium: true, pro: true },
  { feature: 'Exposed files check', base: true, premium: true, pro: true },
  { feature: 'AI security advisor', base: false, premium: true, pro: true },
  { feature: 'Advanced vulnerability scanning', base: false, premium: true, pro: true },
  { feature: 'SSL/TLS configuration analysis', base: 'Basic', premium: 'Advanced', pro: 'Comprehensive' },
  { feature: 'NIS2 compliance toolset', base: 'Basic', premium: 'Full', pro: 'Complete' },
  { feature: 'Email notifications', base: false, premium: true, pro: true },
  { feature: 'White-labeled reports', base: false, premium: false, pro: true },
  { feature: 'Phone support', base: false, premium: false, pro: true },
];

// FAQ data
const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise clients can arrange for invoice payment.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, we offer a 14-day free trial of our Premium plan for new users. No credit card required to start.'
  },
  {
    question: 'Do you offer discounts for annual subscriptions?',
    answer: 'Yes, you can save 20% by choosing annual billing on any of our plans.'
  },
  {
    question: 'What\'s your refund policy?',
    answer: 'We offer a 30-day money-back guarantee on all plans. If you\'re not satisfied, just contact our support team for a full refund.'
  }
];

const Plans = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest('POST', '/api/user/plan', { plan: planId });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plan updated",
        description: `Your subscription has been updated to the ${data.plan} plan.`,
      });
      refreshUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlanActivation = (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to change your subscription plan.",
        variant: "destructive",
      });
      return;
    }

    changePlanMutation.mutate(planId);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-400">Choose the perfect plan for your security needs</p>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={user?.plan}
            onActivate={() => handlePlanActivation(plan.id)}
            isPending={changePlanMutation.isPending}
          />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Feature Comparison</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-center">Base</TableHead>
                <TableHead className="text-center font-medium text-primary">Premium</TableHead>
                <TableHead className="text-center">Pro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.feature}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {typeof item.base === 'boolean' ? (
                      item.base ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )
                    ) : (
                      item.base
                    )}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {typeof item.premium === 'boolean' ? (
                      item.premium ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )
                    ) : (
                      <span className="font-medium text-primary">{item.premium}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {typeof item.pro === 'boolean' ? (
                      item.pro ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )
                    ) : (
                      item.pro
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="font-medium mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {faq.answer}
                </p>
                {index < faqs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Plans;
