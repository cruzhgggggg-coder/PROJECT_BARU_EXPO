export {
  LayoutDashboard as DashboardIcon,
  MessageSquare as ConsultationIcon,
  Archive as ArchiveIcon,
  User as ProfileIcon,
  Lock as SecurityIcon,
  Cpu as AIGatewayIcon,
  LogOut as LogoutIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  ChevronRight as ChevronRightIcon,
  AlertCircle as AlertIcon,
} from "lucide-react";

export type IconProps = {
  color?: string;
  size?: number;
  style?: object;
};

export const getGlassStyle = (_opacity?: number, _radius?: number) => ({});
export const getGlowStyle = (_color?: string, _intensity?: number) => ({});
