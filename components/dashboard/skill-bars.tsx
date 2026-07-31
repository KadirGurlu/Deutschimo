import { skills } from "@/data/mock";
import { Progress } from "@/components/ui/progress";

export function SkillBars() {
  return <div className="skill-list">{skills.map((skill) => <div key={skill.label}><div className="skill-label"><span>{skill.label}</span><strong>%{skill.value}</strong></div><Progress value={skill.value} /></div>)}</div>;
}
