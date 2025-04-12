import { useState } from 'react';
import { Loader2, Bot, Send } from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AIAdvisorProps {
  advice: string;
  isPremiumUser: boolean;
  title?: string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ 
  advice, 
  isPremiumUser,
  title = "AI Security Advisor" 
}) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<{ role: 'ai' | 'user', content: string }[]>(
    advice ? [{ role: 'ai', content: advice }] : []
  );
  const { toast } = useToast();

  const askAIMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest('POST', '/api/ai/ask', { question });
      return res.json();
    },
    onSuccess: (data) => {
      setConversation([...conversation, { role: 'user', content: question }, { role: 'ai', content: data.response }]);
      setQuestion('');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to get AI response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    if (!isPremiumUser) {
      toast({
        title: "Premium feature",
        description: "AI advisor is available to Premium and Pro plan subscribers. Upgrade your plan to use this feature.",
      });
      return;
    }
    
    askAIMutation.mutate(question);
  };

  return (
    <Card>
      <CardHeader className="border-b flex justify-between items-center flex-col sm:flex-row gap-4">
        <CardTitle>{title}</CardTitle>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Premium Feature
        </Badge>
      </CardHeader>
      <CardContent className="p-6">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-center text-gray-500 dark:text-gray-400">
              {isPremiumUser 
                ? "Ask a question to get AI security recommendations." 
                : "Upgrade to our Premium or Pro plan to access AI security recommendations."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.map((message, index) => (
              <div key={index} className="flex items-start">
                {message.role === 'ai' ? (
                  <>
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="ml-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm max-w-3xl">
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ml-auto bg-primary text-primary-foreground rounded-lg p-3 text-sm max-w-3xl">
                      <p>{message.content}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleAskQuestion} className="flex mt-6">
          <Input
            type="text"
            placeholder={isPremiumUser ? "Ask a follow-up question..." : "Upgrade to Premium to ask questions"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-grow rounded-r-none"
            disabled={!isPremiumUser || askAIMutation.isPending}
          />
          <Button 
            type="submit"
            className="rounded-l-none"
            disabled={!isPremiumUser || askAIMutation.isPending || !question.trim()}
          >
            {askAIMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {isPremiumUser 
            ? "Ask any security-related questions to get expert recommendations."
            : "Unlock unlimited AI consultations with our Premium or Pro plan."}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAdvisor;
