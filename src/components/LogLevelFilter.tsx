
import { Checkbox } from '@/components/ui/checkbox';
import { LogLevel, LogLevelFilter } from '@/types/log';
import { cn } from '@/lib/utils';

interface LogLevelFilterProps {
  filters: LogLevelFilter;
  onChange: (filters: LogLevelFilter) => void;
  counts?: Partial<Record<LogLevel, number>>;
}

export function LogLevelFilter({ filters, onChange, counts }: LogLevelFilterProps) {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
  
  const handleToggleFilter = (level: LogLevel) => {
    onChange({ ...filters, [level]: !filters[level] });
  };
  
  const handleToggleAll = (checked: boolean) => {
    const newFilters = { ...filters };
    levels.forEach(level => {
      newFilters[level] = checked;
    });
    onChange(newFilters);
  };
  
  const allChecked = levels.every(level => filters[level]);
  const someChecked = levels.some(level => filters[level]);
  
  const levelColors = {
    'DEBUG': 'text-log-debug',
    'INFO': 'text-log-info',
    'WARNING': 'text-log-warning',
    'ERROR': 'text-log-error'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="all-levels" 
          checked={allChecked}
          indeterminate={!allChecked && someChecked}
          onCheckedChange={(checked) => handleToggleAll(checked as boolean)}
        />
        <label
          htmlFor="all-levels"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          All Levels
        </label>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2">
        {levels.map((level) => (
          <div key={level} className="flex items-center space-x-2">
            <Checkbox
              id={`level-${level}`}
              checked={filters[level]}
              onCheckedChange={() => handleToggleFilter(level)}
            />
            <label
              htmlFor={`level-${level}`}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center",
                levelColors[level]
              )}
            >
              {level}
              {counts && counts[level] !== undefined && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({counts[level]})
                </span>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
