import React from 'react';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustScore: React.FC<TrustScoreProps> = ({ score, size = 'md' }) => {
  const getColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'lg':
        return 'text-2xl px-6 py-3';
      default:
        return 'text-lg px-4 py-2';
    }
  };

  return (
    <div className={`inline-flex items-center rounded-full font-semibold ${getColor(score)} ${getSizeClasses(size)}`}>
      <span className="mr-2">Trust Score:</span>
      <span className="font-bold">{score.toFixed(1)}</span>
      <span className="ml-1 text-xs opacity-75">/100</span>
    </div>
  );
};

