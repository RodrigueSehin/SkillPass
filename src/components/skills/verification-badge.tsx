import { BadgeCheck, Clock, CircleDashed, TimerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  VERIFICATION_STATUS_LABELS,
  type SkillVerificationStatus,
} from "@/types/skill";

const CONFIG = {
  VERIFIED: { tone: "success", Icon: BadgeCheck },
  PENDING: { tone: "accent", Icon: Clock },
  UNVERIFIED: { tone: "neutral", Icon: CircleDashed },
  EXPIRED: { tone: "danger", Icon: TimerOff },
} as const;

export function VerificationBadge({ status }: { status: SkillVerificationStatus }) {
  const { tone, Icon } = CONFIG[status];
  return (
    <Badge tone={tone}>
      <Icon className="size-3.5" aria-hidden />
      {VERIFICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
