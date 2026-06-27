import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teacherService } from "@/lib/services/teacher.service";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/enseignants/")({
  head: () => ({ meta: [{ title: "Enseignants — ONPS" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const all = teacherService.list();
  const top = teacherService.topPerforming(8);
  const support = teacherService.needingSupport(8);
  const avg = (k: keyof (typeof all)[number] & string) =>
    +(all.reduce((s, t) => s + (t[k] as number), 0) / all.length).toFixed(1);
  const radar = [
    { dim: "Maîtrise",     v: avg("maitriseSavoirs") },
    { dim: "Éthique",      v: avg("ethique") },
    { dim: "Exemplarité",  v: avg("exemplarite") },
    { dim: "Gestion classe", v: avg("gestionClasse") },
    { dim: "Remédiation",  v: avg("capaciteRemediation") },
    { dim: "Efficacité",   v: avg("efficacitePedagogique") },
    { dim: "Progression élèves", v: avg("progressionEleves") },
  ];
  const histo = [40, 50, 60, 70, 80, 90, 100].map((b, i, arr) => {
    const lo = arr[i - 1] ?? 0; const hi = b;
    return { range: `${lo}-${hi}`, count: all.filter(t => t.efficacitePedagogique >= lo && t.efficacitePedagogique < hi).length };
  });
  const trend = [2020, 2021, 2022, 2023, 2024].map((y, i) => ({ year: y, efficacite: 62 + i * 1.5, progression: 60 + i * 1.8 }));

  return (
    <PageShell title="Enseignants" badge="Pilotage RH" subtitle={`${all.length} enseignants suivis — performance pédagogique, exemplarité, accompagnement.`}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Maîtrise" value={avg("maitriseSavoirs")} accent="primary" />
        <KpiCard label="Éthique" value={avg("ethique")} accent="accent" />
        <KpiCard label="Exemplarité" value={avg("exemplarite")} accent="accent" />
        <KpiCard label="Gestion" value={avg("gestionClasse")} accent="info" />
        <KpiCard label="Remédiation" value={avg("capaciteRemediation")} accent="info" />
        <KpiCard label="Efficacité" value={avg("efficacitePedagogique")} accent="primary" />
        <KpiCard label="Progression élèves" value={avg("progressionEleves")} accent="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Profil moyen national" description="7 KPIs pédagogiques agrégés.">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="v" stroke="var(--ci-orange)" fill="var(--ci-orange)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Distribution — efficacité pédagogique" description="Histogramme par tranches.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--ci-green)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Évolution agrégée — 5 ans" description="Efficacité et progression élèves.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[50, 80]} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="efficacite" stroke="var(--ci-orange)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="progression" stroke="var(--ci-green)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top — Enseignants performants</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {top.map((t, i) => (
                <li key={t.teacher.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[color:var(--ci-green)]/10 text-[color:var(--ci-green)] font-semibold text-xs flex items-center justify-center">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{t.teacher.firstName} {t.teacher.lastName}</div>
                      <div className="text-xs text-muted-foreground">{t.teacher.subjectMain} · {t.teacher.diploma}</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{t.score.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-[color:var(--kpi-down)]">Recommandations IA — Accompagnement</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {support.length === 0 && <li className="py-4 text-sm text-muted-foreground">Aucun enseignant identifié comme nécessitant un accompagnement urgent.</li>}
              {support.map(r => (
                <li key={r.teacher.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{r.teacher.firstName} {r.teacher.lastName}</div>
                    <div className="text-xs text-muted-foreground">{r.support.explanation}</div>
                  </div>
                  <Badge variant="outline" className="text-[color:var(--kpi-down)] border-[color:var(--kpi-down)]/30">{(r.support.probability * 100).toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}