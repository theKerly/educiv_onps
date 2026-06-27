import { createFileRoute, Link } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { drenaService } from "@/lib/services/drena.service";
import { schoolService } from "@/lib/services/school.service";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/regions")({
  head: () => ({ meta: [{ title: "Vue régionale — ONPS" }] }),
  component: RegionsPage,
});

function RegionsPage() {
  const ranking = drenaService.ranking();
  const [selectedId, setSelectedId] = useState(ranking[0].drena.id);
  const selected = ranking.find(r => r.drena.id === selectedId)!;
  const schools = schoolService.byDrena(selectedId);
  const top = [...schools].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
  const bottom = [...schools].sort((a, b) => a.performanceScore - b.performanceScore).slice(0, 5);

  const radarData = [
    { dim: "Performance",  v: +selected.performanceAvg.toFixed(1) },
    { dim: "BAC",          v: +(selected.successBac * 100).toFixed(1) },
    { dim: "BEPC",         v: +(selected.successBepc * 100).toFixed(1) },
    { dim: "Assiduité",    v: +selected.attendanceAvg.toFixed(1) },
    { dim: "Parité F",     v: +(selected.genderParity * 100).toFixed(1) },
    { dim: "Anti-abandon", v: +(100 - selected.dropoutRate * 100).toFixed(1) },
  ];

  return (
    <PageShell
      title="Vue régionale"
      badge="DRENA"
      subtitle="Comparaisons entre les 12 directions régionales — performance, équité, examens, alertes IA."
      actions={
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ranking.map(r => <SelectItem key={r.drena.id} value={r.drena.id}>{r.drena.name}</SelectItem>)}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Établissements" value={selected.schools} accent="primary" />
        <KpiCard label="Élèves" value={selected.students.toLocaleString("fr-FR")} accent="accent" />
        <KpiCard label="Enseignants" value={selected.teachers.toLocaleString("fr-FR")} accent="info" />
        <KpiCard label="Score perf." value={`${selected.performanceAvg.toFixed(1)}/100`} accent="primary" />
        <KpiCard label="Réussite BAC" value={`${(selected.successBac * 100).toFixed(1)}%`} accent="accent" />
        <KpiCard label="Abandon" value={`${(selected.dropoutRate * 100).toFixed(1)}%`} accent="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Classement régional (DRENA)" description="Score composite — toutes les DRENA.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking.map(r => ({ name: r.drena.code, value: +r.performanceAvg.toFixed(1) }))} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {ranking.map((r, i) => (
                  <Cell key={i} fill={r.drena.id === selectedId ? "var(--ci-orange)" : "var(--chart-3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Profil régional — multi-dimensions" description={`${selected.drena.name} sur 6 axes.`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="v" stroke="var(--ci-orange)" fill="var(--ci-orange)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Répartition des effectifs" description="Élèves par cycle dans la DRENA.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { cycle: "Primaire", students: schools.filter(s => s.cycle === "primaire").reduce((s, x) => s + x.studentCount, 0) },
              { cycle: "Collège",  students: schools.filter(s => s.cycle === "college").reduce((s, x) => s + x.studentCount, 0) },
              { cycle: "Lycée",    students: schools.filter(s => s.cycle === "lycee").reduce((s, x) => s + x.studentCount, 0) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="students" fill="var(--ci-green)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 5 — Meilleurs établissements</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {top.map((s, i) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[color:var(--ci-green)]/10 text-[color:var(--ci-green)] font-semibold text-xs flex items-center justify-center">{i + 1}</span>
                    <Link to="/etablissements/$id" params={{ id: s.id }} className="hover:underline truncate font-medium text-sm">{s.name}</Link>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{s.performanceScore.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-[color:var(--kpi-down)]">Établissements en difficulté</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {bottom.map((s, i) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[color:var(--kpi-down)]/10 text-[color:var(--kpi-down)] font-semibold text-xs flex items-center justify-center">{i + 1}</span>
                    <Link to="/etablissements/$id" params={{ id: s.id }} className="hover:underline truncate font-medium text-sm">{s.name}</Link>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[color:var(--kpi-down)] border-[color:var(--kpi-down)]/30">{s.performanceScore.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}