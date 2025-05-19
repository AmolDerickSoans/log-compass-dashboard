
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LogLevelFilter as FilterType, LogMessage, LogLevel, LogSession } from '@/types/log';
import { LogEntry } from '@/components/LogEntry';
import { LogLevelFilter } from '@/components/LogLevelFilter';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, X, Pause, Play, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

interface LogDashboardProps {
  websocketUrl?: string;
}

export function LogDashboard({ websocketUrl = 'ws://localhost:8000/logs/ws/logs' }: LogDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [levelFilters, setLevelFilters] = useState<FilterType>({
    INFO: true,
    DEBUG: true,
    WARNING: true,
    ERROR: true
  });
  const [sessions, setSessions] = useState<LogSession[]>([
    { id: 'default', name: 'Default', websocketUrl, logs: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [filteredLogs, setFilteredLogs] = useState<LogMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [levelCounts, setLevelCounts] = useState<Record<LogLevel, number>>({
    INFO: 0,
    DEBUG: 0,
    WARNING: 0,
    ERROR: 0
  });
  
  const activeSession = sessions.find(session => session.id === activeSessionId) || sessions[0];
  
  const { logs, status, clearLogs, togglePause } = useWebSocket({
    url: activeSession.websocketUrl,
    autoShowToasts: false // Disable automatic toast notifications
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Update session logs when the websocket logs change
  useEffect(() => {
    if (logs.length > 0) {
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId 
            ? { ...session, logs } 
            : session
        )
      );
    }
  }, [logs, activeSessionId]);
  
  // Effect for focusing search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // Handle search and filtering
  useEffect(() => {
    const logs = activeSession.logs;
    
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
  }, [activeSession.logs, levelFilters, searchTerm, activeSession]);
  
  // Toggle pause
  const handlePauseToggle = () => {
    setIsPaused(togglePause());
  };
  
  // Create new session
  const handleNewSession = () => {
    const id = nanoid();
    const newSession = {
      id,
      name: `Session ${sessions.length + 1}`,
      websocketUrl,
      logs: []
    };
    
    setSessions([...sessions, newSession]);
    setActiveSessionId(id);
  };
  
  // Remove session
  const handleRemoveSession = (sessionId: string) => {
    // Don't remove if it's the only session
    if (sessions.length <= 1) {
      return;
    }
    
    const newSessions = sessions.filter(session => session.id !== sessionId);
    
    // If we're removing the active session, set active to the first available
    if (sessionId === activeSessionId) {
      setActiveSessionId(newSessions[0].id);
    }
    
    setSessions(newSessions);
  };
  
  // Clear active session logs
  const handleClearLogs = () => {
    clearLogs();
    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, logs: [] } 
          : session
      )
    );
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
      <div className="py-3 px-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-lg">Log Dashboard</h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2"
              onClick={handleNewSession}
            >
              <PlusCircle size={16} className="mr-1" />
              New Session
            </Button>
          </div>
        </div>
        
        <Tabs value={activeSessionId} onValueChange={setActiveSessionId} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-thin mb-1">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center">
                <TabsTrigger 
                  value={session.id}
                  className="min-w-[100px] whitespace-nowrap group"
                >
                  {session.name}
                  {sessions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSession(session.id);
                      }}
                    >
                      <Trash2 size={12} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </TabsTrigger>
              </div>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      <div className="py-2 px-4 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {activeSession.logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {filteredLogs.length} / {activeSession.logs.length} logs
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
              <LogLevelFilter 
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
            onClick={handleClearLogs}
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
            {activeSession.logs.length > 0 
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
              className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
