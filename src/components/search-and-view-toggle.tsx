import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, TableProperties, FileText } from "lucide-react";

interface SearchAndViewToggleProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: string;
  onViewModeChange: (value: string) => void;
}

export function SearchAndViewToggle({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: SearchAndViewToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="메시지 제목, 내용, 채널로 검색..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Tabs value={viewMode} onValueChange={onViewModeChange}>
        <TabsList>
          <TabsTrigger value="card" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            카드형
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <TableProperties className="h-4 w-4" />
            테이블형
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <FileText className="h-4 w-4" />
            로그
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
