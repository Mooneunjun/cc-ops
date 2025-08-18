import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  onClearFilters,
}: SearchFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="search">검색</Label>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          필터 초기화
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder="송금번호, 수취인명, 송금국가, 지급국가 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
