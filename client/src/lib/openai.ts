import { apiRequest } from './queryClient';

// Function to get AI security recommendations based on scan results
export async function getSecurityRecommendations(scanResults: any): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/security-advice', { scanResults });
    const data = await response.json();
    return data.advice || '';
  } catch (error) {
    console.error('Error getting AI security recommendations:', error);
    return 'Unable to generate AI recommendations at this time. Please try again later.';
  }
}

// Function to get NIS2 compliance recommendations based on assessment answers
export async function getComplianceRecommendations(answers: any[]): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/compliance-advice', { answers });
    const data = await response.json();
    return data.advice || '';
  } catch (error) {
    console.error('Error getting AI compliance recommendations:', error);
    return 'Unable to generate compliance recommendations at this time. Please try again later.';
  }
}

// Function to ask AI follow-up questions
export async function askAIQuestion(question: string, context?: string): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/ask', { 
      question,
      context
    });
    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Error asking AI question:', error);
    return 'Unable to process your question at this time. Please try again later.';
  }
}
