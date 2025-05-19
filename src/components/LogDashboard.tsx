
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LogLevelFilter, LogMessage, LogLevel } from '@/types/log';
import { LogEntry } from '@/components/LogEntry';
import { LogLevelFilter as LogFilter } from '@/components/LogLevelFilter';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, X, Pause, Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface LogDashboardProps {
  websocketUrl?: string;
}

export function LogDashboard({ websocketUrl = 'ws://localhost:8000/logs/ws/logs' }: LogDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [levelFilters, setLevelFilters] = useState<LogLevelFilter>({
    INFO: true,
    DEBUG: true,
    WARNING: true,
    ERROR: true
  });
  const [filteredLogs, setFilteredLogs] = useState<LogMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [levelCounts, setLevelCounts] = useState<Record<LogLevel, number>>({
    INFO: 0,
    DEBUG: 0,
    WARNING: 0,
    ERROR: 0
  });
  
  const { logs, status, clearLogs, togglePause } = useWebSocket({
    url: websocketUrl
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Effect for focusing search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // Handle search and filtering
  useEffect(() => {
    const filtered = logs.filter((log) => {
      const matchesLevel = levelFilters[log.level];
      const matchesSearch = !searchTerm || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.function.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesLevel && matchesSearch;
    });
    
    setFilteredLogs(filtered);
    
    // Count logs by level
    const counts: Record<LogLevel, number> = {
      INFO: 0,
      DEBUG: 0,
      WARNING: 0,
      ERROR: 0
    };
    
    logs.forEach(log => {
      counts[log.level]++;
    });
    
    setLevelCounts(counts);
  }, [logs, levelFilters, searchTerm]);
  
  // Toggle pause
  const handlePauseToggle = () => {
    setIsPaused(togglePause());
  };
  
  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('logLevelFilters');
    if (savedFilters) {
      try {
        setLevelFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
  }, []);
  
  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('logLevelFilters', JSON.stringify(levelFilters));
  }, [levelFilters]);
  
  return (
    <div className="flex flex-col h-full bg-background dark border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="py-3 px-4 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg">Log Dashboard</h1>
          <StatusIndicator status={status} />
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {filteredLogs.length} / {logs.length} logs
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-[200px] pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} />
              <span className="sr-only">Search</span>
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Filter size={16} />
                <span className="sr-only">Filter</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <h3 className="text-lg font-medium mb-4">Filter Logs</h3>
              <LogFilter 
                filters={levelFilters} 
                onChange={setLevelFilters}
                counts={levelCounts}
              />
            </SheetContent>
          </Sheet>
          
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handlePauseToggle}>
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            <span className="sr-only">{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-8" 
            onClick={clearLogs}
          >
            Clear
          </Button>
        </div>
      </div>
      
      {/* Log list */}
      {filteredLogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-2">No logs to display</p>
          <p className="text-xs text-muted-foreground">
            {logs.length > 0 
              ? 'Try adjusting your filters' 
              : status === 'connected' 
                ? 'Waiting for logs...' 
                : 'Connect to view logs'
            }
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredLogs.map((log, index) => (
            <LogEntry 
              key={`${log.time}-${index}`} 
              log={log}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
