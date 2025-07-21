import { Play, Pause, CheckCircle, AlertCircle } from "lucide-react";

// 상태 설정
const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700",
    icon: Play,
    text: "Active",
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700",
    icon: Pause,
    text: "Paused",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
    text: "Completed",
  },
  error: {
    label: "Error",
    color: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700",
    icon: AlertCircle,
    text: "Error",
  },
};

interface StatusStatsProps {
  getStatusCount: (status: keyof typeof statusConfig) => number;
}

export function StatusStats({ getStatusCount }: StatusStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm">
      {Object.entries(statusConfig).map(([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          <span className="text-muted-foreground">{config.label}</span>
          <span className="font-medium">
            {getStatusCount(key as keyof typeof statusConfig)}
          </span>
        </div>
      ))}
    </div>
  );
}

export { statusConfig };
