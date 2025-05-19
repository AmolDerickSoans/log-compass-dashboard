
export type LogLevel = 'INFO' | 'DEBUG' | 'WARNING' | 'ERROR';

export interface LogMessage {
  time: string;
  level: LogLevel;
  message: string;
  name: string;
  function: string;
  line: number;
}

export type LogLevelFilter = Record<LogLevel, boolean>;

export interface LogSession {
  id: string;
  name: string;
  websocketUrl: string;
  logs: LogMessage[];
}
