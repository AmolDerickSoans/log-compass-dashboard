import { useState } from 'react';
import { Copy, ArrowDown, ArrowUp } from 'lucide-react';
import { LogMessage } from '@/types/log';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface LogEntryProps {
  log: LogMessage;
  searchTerm?: string;
  className?: string;
}

export function LogEntry({ log, searchTerm, className }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false);
  
  const formattedTime = new Date(log.time).toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  const source = `${log.name}:${log.function}:${log.line}`;
  
  // Check if the message might be JSON
  const isJsonMessage = log.message.trim().startsWith('{') && log.message.trim().endsWith('}');
  let formattedMessage = log.message;
  let jsonObject = null;
  
  if (isJsonMessage) {
    try {
      jsonObject = JSON.parse(log.message);
      if (expanded) {
        formattedMessage = JSON.stringify(jsonObject, null, 2);
      }
    } catch (e) {
      // Not valid JSON, keep original message
    }
  }
  
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-accent-foreground/20 rounded px-0.5">$1</mark>');
  };
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(log.message);
    toast({
      description: "Copied to clipboard"
    });
  };
  
  const logLevelColor = {
    'INFO': 'text-log-info',
    'DEBUG': 'text-log-debug',
    'WARNING': 'text-log-warning',
    'ERROR': 'text-log-error'
  }[log.level] || 'text-foreground';
  
  return (
    <div className={cn(
      "border-b border-border/40 py-3 px-4 animate-fade-in",
      className
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{formattedTime}</span>
          <span className={cn("font-medium", logLevelColor)}>{log.level}</span>
          <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]" title={source}>
            {source}
          </span>
        </div>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopyClick}
          >
            <Copy size={14} />
            <span className="sr-only">Copy message</span>
          </Button>
          {isJsonMessage && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
            </Button>
          )}
        </div>
      </div>
      <div 
        className={cn(
          "text-sm log-content",
          isJsonMessage && expanded && "whitespace-pre font-mono text-xs mt-2 bg-secondary/50 p-2 rounded overflow-x-auto scrollbar-thin"
        )}
        dangerouslySetInnerHTML={{ __html: highlightSearchTerm(formattedMessage) }}
      />
    </div>
  );
}
