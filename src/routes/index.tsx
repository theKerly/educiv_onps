import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { Users, School as SchoolIcon, GraduationCap, Map, TrendingUp, AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nationalService } from "@/lib/services/national.service";
import { drenaService } from "@/lib/services/drena.service";
import { schoolService } from "@/lib/services/school.service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vue nationale — ONPS" },
      { name: "description", content: "Tableau de bord national : élèves, enseignants, établissements, DRENA, examens." },
    ],
  }),
  component: NationalDashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function NationalDashboard() {
  const kpis = nationalService.kpis();
  const trend = nationalService.yearlyEvolution();
  const ranking = drenaService.ranking();
  const topSchools = schoolService.topPerforming(5);
  const atRisk = schoolService.atRisk(5);
  const fmt = new Intl.NumberFormat("fr-FR");

  return (
    <PageShell
      title="Vue nationale"
      subtitle="Pilotage en temps réel du système éducatif ivoirien — performance, examens, équité, alertes."
      badge="National"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Élèves" value={fmt.format(kpis.studentTotal)} icon={<Users className="h-5 w-5" />} accent="primary" />
        <KpiCard label="Enseignants" value={fmt.format(kpis.teacherTotal)} icon={<GraduationCap className="h-5 w-5" />} accent="accent" />
        <KpiCard label="Établissements" value={fmt.format(kpis.schoolTotal)} icon={<SchoolIcon className="h-5 w-5" />} accent="info" />
        <KpiCard label="DRENA" value={kpis.drenaTotal} icon={<Map className="h-5 w-5" />} accent="info" />
        <KpiCard label="Réussite BAC" value={`${(kpis.successRateBac * 100).toFixed(1)}%`} trend={{ value: 2.4, positive: true }} accent="accent" />
        <KpiCard label="Réussite BEPC" value={`${(kpis.successRateBepc * 100).toFixed(1)}%`} trend={{ value: 1.8, positive: true }} accent="accent" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Assiduité moyenne" value={`${kpis.attendanceAvg.toFixed(1)}%`} accent="info" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Taux d'abandon" value={`${(kpis.dropoutRate * 100).toFixed(1)}%`} trend={{ value: 0.8, positive: true }} accent="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <KpiCard label="Parité filles" value={`${(kpis.genderParity * 100).toFixed(1)}%`} accent="accent" />
        <KpiCard label="Score performance" value={`${kpis.performanceAvg.toFixed(1)}/100`} accent="primary" />
      </div>

      {/* Trend + parity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Évolution annuelle" description="Réussite BAC, BEPC, performance composite et abandon depuis 2019.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="performance" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Performance" />
              <Line type="monotone" dataKey="successBac" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Réussite BAC %" />
              <Line type="monotone" dataKey="successBepc" stroke="var(--chart-3)" strokeWidth={2} dot={false} name="Réussite BEPC %" />
              <Line type="monotone" dataKey="dropout" stroke="var(--chart-4)" strokeWidth={2} dot={false} name="Abandon %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Classement par DRENA" description="Score composite de performance des 12 directions régionales.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking.map(r => ({ name: r.drena.code, value: +r.performanceAvg.toFixed(1) }))} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Répartition des établissements" description="Lycées, collèges, écoles primaires par cycle.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[
                { name: "Lycées", value: schoolService.list().filter(s => s.cycle === "lycee").length },
                { name: "Collèges", value: schoolService.list().filter(s => s.cycle === "college").length },
                { name: "Primaire", value: schoolService.list().filter(s => s.cycle === "primaire").length },
              ]} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                {CHART_COLORS.slice(0, 3).map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top / Risk */}
      <SectionHeader title="Établissements à la loupe" subtitle="Top performances et alertes IA — fiabilité contextualisée." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 5 — Meilleurs établissements</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {topSchools.map((s, i) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[color:var(--ci-green)]/10 text-[color:var(--ci-green)] font-semibold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.city} · {s.studentCount} élèves</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">{s.performanceScore.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-[color:var(--kpi-down)]">Alertes IA — Établissements à risque</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {atRisk.length === 0 && <li className="py-4 text-sm text-muted-foreground">Aucune alerte critique en cours.</li>}
              {atRisk.map(r => (
                <li key={r.school.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.school.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.risk.explanation}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-[color:var(--kpi-down)]">{(r.risk.probability * 100).toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">risque</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
