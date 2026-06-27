import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { studentService } from "@/lib/services/student.service";
import { schoolService } from "@/lib/services/school.service";
import { teacherService } from "@/lib/services/teacher.service";
import { drenaService } from "@/lib/services/drena.service";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/classements")({
  head: () => ({ meta: [{ title: "Classements — ONPS" }] }),
  component: RankingsPage,
});

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full text-white font-semibold text-xs flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function RankingsPage() {
  const drenas = drenaService.list();
  const drenaCode = (id: string) => drenas.find(d => d.id === id)?.code ?? "";
  const schoolName = (id: string) => schoolService.byId(id)?.name ?? "";
  const top = studentService.topPerformers(10);
  const progress = studentService.topProgressions(10);
  const tops = schoolService.topPerforming(10);
  const topT = teacherService.topPerforming(10);

  return (
    <PageShell title="Classements" badge="Top national" subtitle="Mise en avant des meilleurs élèves, progressions, établissements et enseignants — toutes DRENA confondues.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🏆 Meilleurs élèves</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {top.map((r, i) => (
                <li key={r.student.id} className="py-2 flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                  <Avatar name={`${r.student.firstName} ${r.student.lastName}`} color="var(--ci-orange)" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.student.firstName} {r.student.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{schoolName(r.student.schoolId)} · {drenaCode(r.student.drenaId)}</div>
                  </div>
                  <Badge variant="secondary">{r.score.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📈 Meilleures progressions</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {progress.map((r, i) => (
                <li key={r.student.id} className="py-2 flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                  <Avatar name={`${r.student.firstName} ${r.student.lastName}`} color="var(--ci-green)" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.student.firstName} {r.student.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{schoolName(r.student.schoolId)} · {drenaCode(r.student.drenaId)}</div>
                  </div>
                  <Badge className="bg-[color:var(--ci-green)]/15 text-[color:var(--ci-green)]">+{r.progression.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🏫 Meilleurs établissements</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {tops.map((s, i) => (
                <li key={s.id} className="py-2 flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                  <Avatar name={s.name} color="var(--kpi-info)" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{drenaCode(s.drenaId)} · {s.studentCount} élèves</div>
                  </div>
                  <Badge variant="secondary">{s.performanceScore.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">👩‍🏫 Meilleurs enseignants</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {topT.map((r, i) => (
                <li key={r.teacher.id} className="py-2 flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                  <Avatar name={`${r.teacher.firstName} ${r.teacher.lastName}`} color="var(--chart-5)" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.teacher.firstName} {r.teacher.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.teacher.subjectMain} · {schoolName(r.teacher.schoolId)}</div>
                  </div>
                  <Badge variant="secondary">{r.score.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}