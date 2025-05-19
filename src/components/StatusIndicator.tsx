
import { Check, Loader, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === 'connected' && (
        <>
          <Check size={16} className="text-log-info" />
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
          <WifiOff size={16} className="text-log-error" />
          <span className="text-sm font-medium text-log-error">Disconnected</span>
        </>
      )}
    </div>
  );
}
