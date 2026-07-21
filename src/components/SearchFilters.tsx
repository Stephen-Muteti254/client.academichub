import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface SearchFiltersProps {
  onFiltersChange?: (filters: any) => void;
  showDateFilter?: boolean;
  showBudgetFilter?: boolean;
  showStatusFilter?: boolean;
  placeholder?: string;
}

export function SearchFilters({ 
  onFiltersChange,
  showDateFilter = true,
  showBudgetFilter = true,
  showStatusFilter = true,
  placeholder = "Search orders..."
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [budgetRange, setBudgetRange] = useState({ min: "", max: "" });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Trigger search functionality
  };

  const addFilter = (filterType: string, value: string) => {
    const newFilter = `${filterType}:${value}`;
    if (!activeFilters.includes(newFilter)) {
      setActiveFilters([...activeFilters, newFilter]);
    }
  };

  const removeFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(filter => filter !== filterToRemove));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
    setSelectedStatus("");
    setDateRange(undefined);
    setBudgetRange({ min: "", max: "" });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        {showStatusFilter && (
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showDateFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-40 justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} -{" "}
                      {format(dateRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {showBudgetFilter && (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Min"
              value={budgetRange.min}
              onChange={(e) => setBudgetRange({...budgetRange, min: e.target.value})}
              className="w-20"
              type="number"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              placeholder="Max"
              value={budgetRange.max}
              onChange={(e) => setBudgetRange({...budgetRange, max: e.target.value})}
              className="w-20"
              type="number"
            />
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={clearAllFilters}
          disabled={activeFilters.length === 0}
        >
          <Filter className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter.split(':')[1]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter(filter)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}