import React from 'react';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ 
  score, 
  size = 100, 
  strokeWidth = 10,
  colorClass,
}) => {
  // Calculate values for SVG
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score / 100);
  
  // Determine color based on score
  const getColorClass = () => {
    if (colorClass) return colorClass;
    return score >= 80 ? 'text-green-500' : (score >= 60 ? 'text-yellow-500' : 'text-red-500');
  };

  const getStatusText = () => {
    return score >= 80 ? 'Good' : (score >= 60 ? 'Fair' : 'Poor');
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle 
          className="text-gray-200 dark:text-gray-700" 
          strokeWidth={strokeWidth} 
          stroke="currentColor" 
          fill="transparent" 
          r={radius} 
          cx={size / 2} 
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle 
          className={`transform -rotate-90 origin-center ${getColorClass()}`}
          strokeWidth={strokeWidth} 
          stroke="currentColor" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          fill="transparent" 
          r={radius} 
          cx={size / 2} 
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}/100</span>
        <span className="text-sm font-medium" aria-label={`Security score: ${getStatusText()}`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default ScoreCircle;
