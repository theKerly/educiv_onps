import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { schoolService } from "@/lib/services/school.service";
import { teacherService } from "@/lib/services/teacher.service";
import { studentService } from "@/lib/services/student.service";
import { analyticsService } from "@/lib/services/analytics.service";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, Legend,
  ComposedChart, Area, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/predictif")({
  head: () => ({ meta: [{ title: "Analyse prédictive — ONPS" }] }),
  component: PredictivePage,
});

function PredictivePage() {
  // Sample student for a representative prediction
  const sample = studentService.list().slice(0, 200);
  const dropoutAlerts = sample
    .map(s => ({ s, r: studentService.byId(s.id)!.dropoutRisk }))
    .filter(x => x.r.label === "a_risque")
    .sort((a, b) => b.r.probability - a.r.probability)
    .slice(0, 6);

  const bepcForecasts = sample.map(s => studentService.byId(s.id)!.bepcForecast);
  const bepcReussite = bepcForecasts.filter(b => b.label === "reussite").length / Math.max(1, bepcForecasts.length);

  const schoolsAtRisk = schoolService.atRisk(6);
  const teachersSupport = teacherService.needingSupport(6);

  const sampleVars = dropoutAlerts[0]?.r.variables ?? [];

  const cohorts = analyticsService.cohorts();
  const equity = analyticsService.equity();
  const { bac, bepc } = analyticsService.projections();

  const COHORT_COLORS: Record<string, string> = {
    excellence: "var(--ci-green)",
    potentiel:  "var(--ci-orange)",
    vulnerable: "var(--kpi-down)",
    standard:   "#94a3b8",
  };

  const radarData = ["academic", "engagement", "skills", "context"].map(dim => {
    const row: Record<string, number | string> = { dimension: dim === "academic" ? "Académique" : dim === "engagement" ? "Engagement" : dim === "skills" ? "Compétences" : "Contexte" };
    cohorts.profiles.forEach(p => { row[p.title] = Math.round(p[dim as "academic" | "engagement" | "skills" | "context"]); });
    return row;
  });

  const buildProjectionSeries = (series: typeof bac) =>
    series.map(p => ({
      year: p.year,
      taux: +(p.successRate * 100).toFixed(1),
      bandeBasse: p.confidenceLow !== undefined ? +(p.confidenceLow * 100).toFixed(1) : null,
      bandeHaute: p.confidenceHigh !== undefined ? +(p.confidenceHigh * 100).toFixed(1) : null,
      projeté: p.projected,
    }));

  const models = [
    { name: "Décrochage", desc: "Logistique multifactorielle — assiduité, progression, engagement, contexte.", accuracy: 0.81, n: sample.length },
    { name: "Réussite BEPC", desc: "Régression logistique pondérée par les coefficients de matières.", accuracy: 0.74, n: bepcForecasts.length },
    { name: "Réussite BAC", desc: "Régression série-dépendante (C/D/A/G).", accuracy: 0.71, n: 0 },
    { name: "Établissements à risque", desc: "Score composite — examens, infrastructure, ratio classe.", accuracy: 0.77, n: schoolService.list().length },
    { name: "Enseignants à accompagner", desc: "Combinaison des 5 KPIs pédagogiques.", accuracy: 0.83, n: teacherService.list().length },
    { name: "Orientation Post-Bac", desc: "Multi-filière, pondération matières/années/compétences.", accuracy: 0.69, n: 0 },
  ];

  return (
    <PageShell
      title="Analyse prédictive"
      badge="IA — Simulations"
      subtitle="Modèles transparents et configurables. Les paramètres sont définis dans src/lib/params — ces simulations ne sont pas entraînées sur des données réelles du Ministère."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Alertes décrochage" value={dropoutAlerts.length} accent="danger" />
        <KpiCard label="Prédiction BEPC" value={`${(bepcReussite * 100).toFixed(0)}%`} accent="accent" hint="taux de réussite projeté" />
        <KpiCard label="Établissements à risque" value={schoolsAtRisk.length} accent="warn" />
        <KpiCard label="Enseignants à accompagner" value={teachersSupport.length} accent="warn" />
      </div>

      {/* ----------- Segmentation de cohorte (k-means 4 profils) ----------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Segmentation de cohorte — 4 profils élèves</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2">
            {cohorts.distribution.map(d => (
              <div key={d.cohort} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: COHORT_COLORS[d.cohort] }} />
                    {d.title}
                  </div>
                  <Badge variant="secondary">{(d.share * 100).toFixed(1)}%</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{d.count.toLocaleString("fr-FR")} élèves</div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {cohorts.profiles.map(p => (
                  <Radar key={p.label} name={p.title} dataKey={p.title}
                    stroke={COHORT_COLORS[p.label]} fill={COHORT_COLORS[p.label]} fillOpacity={0.18} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --------------------- Équité éducative --------------------- */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Index d'équité éducative</CardTitle>
          <Badge variant="outline" className="text-[color:var(--ci-green)] border-[color:var(--ci-green)]/30">
            Index global : {equity.global}/100
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {equity.dimensions.map(d => (
            <div key={d.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{d.name}</div>
                <Badge variant="secondary">{d.parityIndex}/100</Badge>
              </div>
              <Progress value={d.parityIndex} className="h-1.5 mt-2" />
              <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                <div>{d.groupA.label} : <strong className="text-foreground">{d.groupA.mean}</strong> (n={d.groupA.n.toLocaleString("fr-FR")})</div>
                <div>{d.groupB.label} : <strong className="text-foreground">{d.groupB.mean}</strong> (n={d.groupB.n.toLocaleString("fr-FR")})</div>
                <div className="pt-1">Écart : <strong className="text-foreground">{d.gap} pts</strong></div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 italic">{d.interpretation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* --------------------- Projections nationales --------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Projection BAC (3 ans)", data: buildProjectionSeries(bac), color: "var(--ci-orange)" },
          { title: "Projection BEPC (3 ans)", data: buildProjectionSeries(bepc), color: "var(--ci-green)" },
        ].map(p => (
          <Card key={p.title}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{p.title}</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={p.data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Area type="monotone" dataKey="bandeHaute" stroke="none" fill={p.color} fillOpacity={0.12} />
                  <Area type="monotone" dataKey="bandeBasse" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                  <Line type="monotone" dataKey="taux" stroke={p.color} strokeWidth={2.4} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-muted-foreground mt-1">
                Régression linéaire sur historique + intervalle de confiance à 95 %. Les années pleines sont projetées.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Catalogue des modèles</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map(m => (
            <div key={m.name} className="rounded-lg border p-3 hover:bg-muted/30 transition">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm">{m.name}</div>
                <Badge variant="secondary">~{(m.accuracy * 100).toFixed(0)}% conf.</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              <div className="text-[11px] text-muted-foreground mt-2">Échantillon simulé : <strong className="text-foreground">{m.n.toLocaleString("fr-FR") || "—"}</strong></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Importance des variables — Décrochage</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleVars.map(v => ({ name: v.name, importance: +(v.importance * 100).toFixed(1) }))} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="importance" fill="var(--ci-orange)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-[color:var(--kpi-down)]">Top alertes — Élèves à risque</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {dropoutAlerts.map(({ s, r }) => (
                <li key={s.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-muted-foreground">{r.explanation}</div>
                  </div>
                  <Badge variant="outline" className="text-[color:var(--kpi-down)] border-[color:var(--kpi-down)]/30">{(r.probability * 100).toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}