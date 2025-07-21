import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit3, Trash2, Pause, Play } from "lucide-react";

interface ActionButtonsProps {
  message: {
    id: number;
    status: string;
  };
  onAction: (action: string, messageId: number, currentStatus?: string) => void;
}

export function ActionButtons({ message, onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {(message.status === "active" || message.status === "paused") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            onAction(
              message.status === "active" ? "pause" : "resume",
              message.id,
              message.status
            )
          }
        >
          {message.status === "active" ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAction("edit", message.id)}>
            <Edit3 className="mr-2 h-4 w-4" />
            수정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction("delete", message.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
