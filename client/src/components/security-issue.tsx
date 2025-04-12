import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface SecurityIssueProps {
  issue: {
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
  };
}

const SecurityIssue: React.FC<SecurityIssueProps> = ({ issue }) => {
  // Determine background color based on issue type
  const getBgColor = () => {
    switch (issue.type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return '';
    }
  };

  // Get icon based on issue type
  const getIcon = () => {
    switch (issue.type) {
      case 'critical':
        return <AlertCircle className="h-6 w-6" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      case 'info':
        return <Info className="h-6 w-6" />;
      default:
        return null;
    }
  };

  // Get icon container background color
  const getIconBgColor = () => {
    switch (issue.type) {
      case 'critical':
        return 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-500 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-200';
      default:
        return '';
    }
  };

  return (
    <div className={`p-6 ${getBgColor()}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full ${getIconBgColor()}`}>
          {getIcon()}
        </div>
        <div className="ml-4">
          <h4 className="text-base font-medium">{issue.title}</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityIssue;
