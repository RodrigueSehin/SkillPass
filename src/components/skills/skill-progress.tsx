import { Progress } from "@/components/ui/progress";
import { SKILL_LEVEL_LABELS, levelFromScore } from "@/types/skill";

interface SkillProgressProps {
  name: string;
  score: number;
}

export function SkillProgress({ name, score }: SkillProgressProps) {
  const level = SKILL_LEVEL_LABELS[levelFromScore(score)];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted">
          <span className="text-foreground font-semibold">{score}%</span> · {level}
        </span>
      </div>
      <Progress value={score} aria-label={`${name} : ${score}%`} />
    </div>
  );
}
