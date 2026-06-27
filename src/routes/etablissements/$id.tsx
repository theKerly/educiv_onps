import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { schoolService } from "@/lib/services/school.service";
import { drenaService } from "@/lib/services/drena.service";
import { teacherService } from "@/lib/services/teacher.service";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Wifi, BookOpen, Zap, Droplet } from "lucide-react";

export const Route = createFileRoute("/etablissements/$id")({
  head: () => ({ meta: [{ title: "Fiche établissement — ONPS" }] }),
  component: SchoolDetails,
});

function SchoolDetails() {
  const { id } = Route.useParams();
  const d = schoolService.details(id);
  if (!d) throw notFound();
  const drena = drenaService.byId(d.school.drenaId);
  const teachers = teacherService.list({ schoolId: id }).slice(0, 8);

  const trend = [2020, 2021, 2022, 2023, 2024].map((y, i) => ({
    year: y,
    perf: +(d.school.performanceScore - 5 + i * 1.1).toFixed(1),
    abs:  +(15 - i * 1.2).toFixed(1),
  }));
  const radar = [
    { dim: "Réussite",    v: +(d.school.performanceScore).toFixed(0) },
    { dim: "Assiduité",   v: +d.attendanceAvg.toFixed(0) },
    { dim: "BAC",         v: +(d.successBac * 100).toFixed(0) || 0 },
    { dim: "BEPC",        v: +(d.successBepc * 100).toFixed(0) || 0 },
    { dim: "Climat",      v: 72 },
    { dim: "Infrastructure", v: ((+d.school.hasInternet + +d.school.hasLibrary + +d.school.hasElectricity + +d.school.hasWater) / 4) * 100 },
  ];

  return (
    <PageShell
      title={d.school.name}
      badge={drena?.code}
      subtitle={`${d.school.city} · ${d.school.cycle.toUpperCase()} · ${d.school.type.replace("_", " ")} · fondé en ${d.school.foundedYear}`}
      actions={<Link to="/etablissements" className="text-sm text-muted-foreground hover:underline">← Retour à l'annuaire</Link>}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Élèves" value={d.studentCount} accent="primary" />
        <KpiCard label="Enseignants" value={d.teacherCount} accent="accent" />
        <KpiCard label="Score" value={`${d.school.performanceScore.toFixed(1)}/100`} accent="info" />
        <KpiCard label="Assiduité" value={`${d.attendanceAvg.toFixed(1)}%`} accent="info" />
        <KpiCard label="BAC" value={d.successBac ? `${(d.successBac * 100).toFixed(1)}%` : "—"} accent="accent" />
        <KpiCard label="Risque IA" value={`${(d.risk.probability * 100).toFixed(0)}%`} accent={d.risk.label === "a_risque" ? "danger" : "info"} hint={d.risk.label === "a_risque" ? "Alerte" : "Stable"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Profil multi-axes" description="Réussite, climat, infrastructure">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="v" stroke="var(--ci-orange)" fill="var(--ci-orange)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Évolution sur 5 ans" description="Performance composite vs. taux d'absentéisme">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="perf" stroke="var(--ci-orange)" strokeWidth={2} dot={false} name="Performance" />
              <Line type="monotone" dataKey="abs"  stroke="var(--kpi-down)" strokeWidth={2} dot={false} name="Absentéisme %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Infrastructures</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <InfraItem ok={d.school.hasInternet} icon={<Wifi className="h-4 w-4" />} label="Internet" />
            <InfraItem ok={d.school.hasLibrary} icon={<BookOpen className="h-4 w-4" />} label="Bibliothèque" />
            <InfraItem ok={d.school.hasElectricity} icon={<Zap className="h-4 w-4" />} label="Électricité" />
            <InfraItem ok={d.school.hasWater} icon={<Droplet className="h-4 w-4" />} label="Eau" />
            <div className="col-span-2 mt-3 text-xs text-muted-foreground border-t pt-3">
              Salles : <strong className="text-foreground">{d.school.classroomCount}</strong> ·
              Ratio élèves/enseignant : <strong className="text-foreground">{(d.studentCount / Math.max(1, d.teacherCount)).toFixed(1)}</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Équipe enseignante (extrait)</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {teachers.map(t => (
                <li key={t.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.firstName} {t.lastName}</div>
                    <div className="text-xs text-muted-foreground">{t.subjectMain} · {t.yearsExperience} ans · {t.diploma}</div>
                  </div>
                  <Badge variant="secondary">{((t.maitriseSavoirs + t.efficacitePedagogique) / 2).toFixed(0)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recommandations IA</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Reco color={d.attendanceAvg < 75 ? "danger" : "ok"} label="Assiduité" text={d.attendanceAvg < 75 ? "Lancer un plan d'action sur l'absentéisme — campagne SMS parents + permanences." : "Assiduité satisfaisante, maintenir le suivi mensuel."} />
            <Reco color={d.risk.label === "a_risque" ? "danger" : "ok"} label="Risque global" text={d.risk.explanation} />
            <Reco color={!d.school.hasInternet ? "warn" : "ok"} label="Infrastructure numérique" text={!d.school.hasInternet ? "Prioriser la connexion Internet pour ouvrir les ressources pédagogiques en ligne." : "Connexion en place — encourager les usages pédagogiques."} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function InfraItem({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 border ${ok ? "bg-[color:var(--ci-green)]/5 border-[color:var(--ci-green)]/20" : "bg-[color:var(--kpi-down)]/5 border-[color:var(--kpi-down)]/20"}`}>
      <span className={ok ? "text-[color:var(--ci-green)]" : "text-[color:var(--kpi-down)]"}>{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs">{ok ? "OK" : "—"}</span>
    </div>
  );
}

function Reco({ color, label, text }: { color: "ok" | "warn" | "danger"; label: string; text: string }) {
  const c = color === "danger" ? "var(--kpi-down)" : color === "warn" ? "var(--kpi-warn)" : "var(--ci-green)";
  return (
    <div className="rounded-md border-l-4 pl-3 py-1.5" style={{ borderColor: `color-mix(in oklch, ${c} 70%, transparent)` }}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: c }}>{label}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{text}</div>
    </div>
  );
}