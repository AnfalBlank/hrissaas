"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  AlarmClock,
  Award,
  Banknote,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Coins,
  Database,
  Eye,
  FileText,
  Fingerprint,
  Flame,
  Gift,
  Globe,
  Handshake,
  HardHat,
  Hash,
  Heart,
  HelpCircle,
  Hourglass,
  Image as ImageIcon,
  Key,
  Landmark,
  Languages,
  Lightbulb,
  Link as LinkIcon,
  ListChecks,
  Loader,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Moon,
  Monitor,
  Newspaper,
  Package,
  PartyPopper,
  PenLine,
  PhoneCall,
  PieChart,
  Receipt,
  Rocket,
  Scan,
  ScanFace,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  Thermometer,
  Ticket,
  Timer,
  Trophy,
  UserCircle2,
  Users,
  Wallet,
  Waves,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

type IconStyle = {
  Icon: LucideIcon;
  /** background gradient classes */
  bg: string;
  /** icon stroke color */
  fg: string;
};

/**
 * Icon registry. All icons are Lucide SVGs rendered inside a colored
 * gradient container. No emoji, no remote images — fully offline & consistent.
 */
const ICONS: Record<string, IconStyle> = {
  // Attendance & biometric
  fingerprint: { Icon: Fingerprint, bg: "from-brand-500 to-brand-700", fg: "white" },
  face: { Icon: ScanFace, bg: "from-brand-500 to-brand-700", fg: "white" },
  qrcode: { Icon: Scan, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  pin: { Icon: MapPin, bg: "from-rose-500 to-rose-700", fg: "white" },
  clock: { Icon: AlarmClock, bg: "from-amber-500 to-amber-600", fg: "white" },
  calendar: { Icon: Calendar, bg: "from-violet-500 to-violet-700", fg: "white" },
  history: { Icon: Hourglass, bg: "from-violet-500 to-violet-700", fg: "white" },
  hourglass: { Icon: Hourglass, bg: "from-amber-500 to-amber-600", fg: "white" },
  stopwatch: { Icon: Timer, bg: "from-emerald-500 to-emerald-700", fg: "white" },

  // People
  people: { Icon: Users, bg: "from-brand-500 to-brand-700", fg: "white" },
  employee: { Icon: UserCircle2, bg: "from-amber-500 to-amber-600", fg: "white" },
  manager: { Icon: Crown, bg: "from-amber-500 to-amber-600", fg: "white" },

  // Money
  payroll: { Icon: Banknote, bg: "from-emerald-500 to-emerald-700", fg: "white" },
  wallet: { Icon: Wallet, bg: "from-emerald-500 to-emerald-700", fg: "white" },
  bank: { Icon: Landmark, bg: "from-emerald-500 to-emerald-700", fg: "white" },
  receipt: { Icon: Receipt, bg: "from-orange-500 to-orange-700", fg: "white" },
  graph: { Icon: Activity, bg: "from-emerald-500 to-emerald-700", fg: "white" },

  // Communication
  bell: { Icon: Bell, bg: "from-rose-500 to-rose-700", fg: "white" },
  chat: { Icon: MessageSquare, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  envelope: { Icon: Mail, bg: "from-amber-500 to-amber-600", fg: "white" },
  megaphone: { Icon: Megaphone, bg: "from-pink-500 to-pink-700", fg: "white" },
  phone: { Icon: PhoneCall, bg: "from-cyan-500 to-cyan-700", fg: "white" },

  // Documents
  memo: { Icon: PenLine, bg: "from-brand-500 to-brand-700", fg: "white" },
  page: { Icon: FileText, bg: "from-ink-500 to-ink-700", fg: "white" },
  chart: { Icon: BarChart3, bg: "from-brand-500 to-brand-700", fg: "white" },
  pieChart: { Icon: PieChart, bg: "from-violet-500 to-violet-700", fg: "white" },
  scroll: { Icon: ScrollText, bg: "from-amber-500 to-amber-600", fg: "white" },

  // Misc
  rocket: { Icon: Rocket, bg: "from-brand-500 to-accent-500", fg: "white" },
  shield: { Icon: Shield, bg: "from-success-500 to-success-600", fg: "white" },
  gear: { Icon: Settings, bg: "from-ink-500 to-ink-700", fg: "white" },
  globe: { Icon: Globe, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  buildings: { Icon: Building2, bg: "from-brand-500 to-brand-700", fg: "white" },
  briefcase: { Icon: Briefcase, bg: "from-ink-500 to-ink-700", fg: "white" },
  star: { Icon: Star, bg: "from-amber-400 to-amber-600", fg: "white" },
  trophy: { Icon: Trophy, bg: "from-amber-400 to-amber-600", fg: "white" },
  fire: { Icon: Flame, bg: "from-orange-500 to-rose-600", fg: "white" },
  bolt: { Icon: Zap, bg: "from-amber-400 to-amber-600", fg: "white" },
  sparkles: { Icon: Sparkles, bg: "from-violet-500 to-pink-500", fg: "white" },
  graduationCap: { Icon: BookOpen, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  toolbox: { Icon: Wrench, bg: "from-ink-500 to-ink-700", fg: "white" },
  package: { Icon: Package, bg: "from-amber-600 to-amber-700", fg: "white" },
  ticket: { Icon: Ticket, bg: "from-rose-500 to-rose-700", fg: "white" },
  party: { Icon: PartyPopper, bg: "from-pink-500 to-rose-600", fg: "white" },
  bedSick: { Icon: Thermometer, bg: "from-rose-500 to-rose-700", fg: "white" },
  beach: { Icon: Waves, bg: "from-cyan-400 to-cyan-600", fg: "white" },
  warning: { Icon: ShieldAlert, bg: "from-warning-500 to-warning-600", fg: "white" },
  check: { Icon: CheckCircle2, bg: "from-success-500 to-success-600", fg: "white" },
  cross: { Icon: XCircle, bg: "from-danger-500 to-danger-600", fg: "white" },
  signature: { Icon: PenLine, bg: "from-ink-500 to-ink-700", fg: "white" },
  camera: { Icon: Camera, bg: "from-violet-500 to-violet-700", fg: "white" },
  satellite: { Icon: MapPin, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  laptop: { Icon: Monitor, bg: "from-ink-500 to-ink-700", fg: "white" },
  mobile: { Icon: Smartphone, bg: "from-ink-500 to-ink-700", fg: "white" },
  key: { Icon: Key, bg: "from-amber-500 to-amber-600", fg: "white" },
  lock: { Icon: Lock, bg: "from-ink-500 to-ink-700", fg: "white" },
  handshake: { Icon: Handshake, bg: "from-brand-500 to-brand-700", fg: "white" },
  bullseye: { Icon: Target, bg: "from-rose-500 to-rose-700", fg: "white" },
  link: { Icon: LinkIcon, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  light: { Icon: Lightbulb, bg: "from-amber-400 to-amber-600", fg: "white" },
  house: { Icon: Building2, bg: "from-brand-500 to-brand-700", fg: "white" },
  pen: { Icon: PenLine, bg: "from-brand-500 to-brand-700", fg: "white" },
  card: { Icon: CreditCard, bg: "from-violet-500 to-violet-700", fg: "white" },
  bag: { Icon: Briefcase, bg: "from-ink-500 to-ink-700", fg: "white" },
  newspaper: { Icon: Newspaper, bg: "from-rose-500 to-rose-700", fg: "white" },
  moon: { Icon: Moon, bg: "from-violet-700 to-violet-900", fg: "white" },
  sun: { Icon: Sun, bg: "from-amber-400 to-amber-500", fg: "white" },

  // Verified extras
  verified: { Icon: BadgeCheck, bg: "from-success-500 to-success-600", fg: "white" },
  award: { Icon: Award, bg: "from-amber-500 to-amber-600", fg: "white" },
  database: { Icon: Database, bg: "from-cyan-600 to-cyan-800", fg: "white" },
  hardhat: { Icon: HardHat, bg: "from-amber-600 to-amber-700", fg: "white" },
  heart: { Icon: Heart, bg: "from-rose-500 to-rose-700", fg: "white" },
  help: { Icon: HelpCircle, bg: "from-ink-500 to-ink-700", fg: "white" },
  image: { Icon: ImageIcon, bg: "from-violet-500 to-violet-700", fg: "white" },
  hash: { Icon: Hash, bg: "from-ink-500 to-ink-700", fg: "white" },
  language: { Icon: Languages, bg: "from-cyan-500 to-cyan-700", fg: "white" },
  list: { Icon: ListChecks, bg: "from-brand-500 to-brand-700", fg: "white" },
  loader: { Icon: Loader, bg: "from-ink-500 to-ink-700", fg: "white" },
  coins: { Icon: Coins, bg: "from-amber-500 to-amber-600", fg: "white" },
  eye: { Icon: Eye, bg: "from-ink-500 to-ink-700", fg: "white" },
};

export type Icon3DName = keyof typeof ICONS;

export function Icon3D({
  name,
  size = 56,
  className,
  alt,
}: {
  name: Icon3DName;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const meta = ICONS[name];
  if (!meta) {
    return (
      <span
        className={cn("inline-block", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const { Icon, bg } = meta;
  // inner icon = ~55% of container, with white stroke
  const iconSize = Math.round(size * 0.55);
  return (
    <span
      role="img"
      aria-label={alt ?? name}
      className={cn(
        "inline-grid place-items-center rounded-2xl bg-gradient-to-br shadow-soft",
        bg,
        className
      )}
      style={{ width: size, height: size, padding: Math.round(size * 0.18) }}
    >
      <Icon
        strokeWidth={2.2}
        className="text-white drop-shadow"
        size={iconSize}
        style={{ width: iconSize, height: iconSize }}
      />
    </span>
  );
}
