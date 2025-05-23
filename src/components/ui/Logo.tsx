import React from 'react';
import { PartyPopper } from 'lucide-react';

interface LogoProps {
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ light = false }) => {
  return (
    <div className="flex items-center">
      <PartyPopper className={`h-8 w-8 ${light ? 'text-primary-400' : 'text-primary-500'}`} />
      <span className={`ml-2 text-xl font-bold ${light ? 'text-white' : 'text-gray-900'}`}>
        CABETG
        <span className={`font-light ${light ? 'text-primary-300' : 'text-primary-500'}`}> 
          Party Planer
        </span>
      </span>
    </div>
  );
};

export default Logo;