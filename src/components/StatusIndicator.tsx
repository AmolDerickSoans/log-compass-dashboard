
import { Check, Loader, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface StatusIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const [prevStatus, setPrevStatus] = useState(status);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    // Only trigger animation when status changes
    if (prevStatus !== status) {
      setIsTransitioning(true);
      setPrevStatus(status);
      
      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1500); // Duration slightly longer than animation
      
      return () => clearTimeout(timer);
    }
  }, [status, prevStatus]);
  
  return (
    <div className={cn(
      "flex items-center gap-2 transition-opacity duration-300",
      isTransitioning && "animate-pulse-subtle",
      className
    )}>
      {status === 'connected' && (
        <>
          <div className="relative">
            <Check size={16} className="text-log-info" />
            {isTransitioning && (
              <span className="absolute inset-0 bg-log-info/20 rounded-full animate-ping opacity-75" />
            )}
          </div>
          <span className="text-sm font-medium text-log-info">Connected</span>
        </>
      )}
      
      {status === 'connecting' && (
        <>
          <Loader size={16} className="text-log-warning animate-spin" />
          <span className="text-sm font-medium text-log-warning">Connecting...</span>
        </>
      )}
      
      {status === 'disconnected' && (
        <>
          <div className="relative">
            <WifiOff size={16} className="text-log-error" />
            {isTransitioning && (
              <span className="absolute inset-0 bg-log-error/20 rounded-full animate-ping opacity-75" />
            )}
          </div>
          <span className="text-sm font-medium text-log-error">Disconnected</span>
        </>
      )}
    </div>
  );
}
