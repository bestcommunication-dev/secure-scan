import { Check, X, Loader2 } from 'lucide-react';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanProps {
  id: string;
  name: string;
  price: number;
  description: string;
  scansPerMonth: number | 'Unlimited';
  features: {
    name: string;
    value?: string;
    included: boolean;
    highlight?: boolean;
  }[];
  recommended?: boolean;
}

interface PlanCardProps {
  plan: PlanProps;
  currentPlan?: string;
  onActivate: (planId: string) => void;
  isPending: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, currentPlan, onActivate, isPending }) => {
  const isCurrentPlan = currentPlan?.toLowerCase() === plan.name.toLowerCase();
  
  return (
    <Card className={`flex flex-col ${plan.recommended ? 'border-2 border-primary transform scale-105 relative z-10' : 'border border-gray-200 dark:border-gray-700'}`}>
      {plan.recommended && (
        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold py-1 px-3 rounded-bl">
          RECOMMENDED
        </div>
      )}
      
      <CardHeader className={`p-6 ${plan.recommended ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
        <CardTitle>{plan.name}</CardTitle>
        <div className="flex items-baseline">
          <span className="text-3xl font-extrabold">${plan.price}</span>
          <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 flex-grow">
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="h-5 w-5 mr-2">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-gray-400" />
                )}
              </span>
              <span className={feature.included ? (feature.highlight ? 'font-semibold' : '') : 'text-gray-400'}>
                {feature.value 
                  ? `${feature.value} ${feature.name}` 
                  : feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className={`p-6 mt-auto ${plan.recommended ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
        <Button 
          className="w-full" 
          onClick={() => onActivate(plan.id)}
          disabled={isPending || isCurrentPlan}
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isCurrentPlan ? 'Current Plan' : 'Activate Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
