import { useState } from 'react';
import { Copy, ArrowDown, ArrowUp } from 'lucide-react';
import { LogMessage } from '@/types/log';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

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
    second: '2-digit'
  }) + '.' + log.time.split('.')[1]?.substring(0, 3) || '000';
  
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
    'INFO': 'text-log-info border-log-info',
    'DEBUG': 'text-log-debug border-log-debug',
    'WARNING': 'text-log-warning border-log-warning',
    'ERROR': 'text-log-error border-log-error'
  }[log.level] || 'text-foreground';
  
  return (
    <div className={cn(
      "border-l-2 py-2 px-4 animate-fade-in",
      logLevelColor,
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-muted-foreground">{formattedTime}</span>
          <span className={cn("font-medium px-1.5 py-0.5 rounded-full text-xs", {
            "bg-log-info/10": log.level === 'INFO',
            "bg-log-debug/10": log.level === 'DEBUG',
            "bg-log-warning/10": log.level === 'WARNING',
            "bg-log-error/10": log.level === 'ERROR',
          })}>
            {log.level}
          </span>
          <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] font-mono text-[10px]" title={source}>
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
        </div>
      </div>
      
      {isJsonMessage ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="py-1 text-sm hover:no-underline">
              <span className="text-xs font-medium">JSON Data</span>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs font-mono bg-secondary/50 p-2 rounded overflow-x-auto scrollbar-thin whitespace-pre">
                {JSON.stringify(jsonObject, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div 
          className="text-sm log-content leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightSearchTerm(formattedMessage) }}
        />
      )}
    </div>
  );
}
