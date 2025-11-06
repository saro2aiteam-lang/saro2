import React from 'react';

interface StickFigureAvatarProps {
  variant: number; // 1-6 for different stick figure styles
  className?: string;
}

const StickFigureAvatar: React.FC<StickFigureAvatarProps> = ({ variant, className = '' }) => {
  const getStickFigure = () => {
    switch (variant) {
      case 1:
        // Person with camera
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="24" y="10" width="6" height="4" rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
        );
      case 2:
        // Business person
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="14" y="22" width="12" height="8" rx="1" fill="currentColor" opacity="0.3"/>
          </svg>
        );
      case 3:
        // Content creator
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="10" r="2" fill="currentColor" opacity="0.5"/>
          </svg>
        );
      case 4:
        // Creative director
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 16 8 L 20 4 L 24 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        );
      case 5:
        // Designer
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="16" y="6" width="8" height="6" rx="1" fill="currentColor" opacity="0.4"/>
          </svg>
        );
      case 6:
        // Educator
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="18" y="6" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.6"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="20" y1="17" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="12" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="28" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="14" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="28" x2="26" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {getStickFigure()}
    </div>
  );
};

export default StickFigureAvatar;

