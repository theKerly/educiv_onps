import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { studentService } from "@/lib/services/student.service";
import { schoolService } from "@/lib/services/school.service";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend,
} from "recharts";
import { meanBySubject, progressionScore } from "@/lib/ai/scoring";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/eleves/$id")({
  head: () => ({ meta: [{ title: "Fiche élève — ONPS" }] }),
  component: StudentDetails,
});

function StudentDetails() {
  const { id } = Route.useParams();
  const d = studentService.byId(id);
  if (!d) throw notFound();
  const { student, grades, scores, dropoutRisk, bepcForecast } = d;
  const school = schoolService.byId(student.schoolId);
  const means = meanBySubject(grades);
  const subjectsBars = Object.entries(means)
    .map(([s, v]) => ({ subject: s.replace(/_/g, " "), value: +v.toFixed(2) }))
    .sort((a, b) => b.value - a.value);
  const trimesterTrend = [1, 2, 3].map(t => {
    const gs = grades.filter(g => g.trimester === t);
    const m = gs.reduce((s, g) => s + g.value * g.coefficient, 0) / Math.max(1, gs.reduce((s, g) => s + g.coefficient, 0));
    return { trimester: `T${t}`, mean: +m.toFixed(2) };
  });

  const skillsRadar = [
    { dim: "Esprit critique", v: student.skills.espritCritique },
    { dim: "Communication",   v: student.skills.communication },
    { dim: "Créativité",      v: student.skills.creativite },
    { dim: "Collaboration",   v: student.skills.collaboration },
    { dim: "Leadership",      v: student.skills.leadership },
    { dim: "Résilience",      v: student.skills.resilience },
    { dim: "Adaptation",      v: student.skills.adaptation },
  ];
  const engagementRadar = [
    { dim: "Assiduité",     v: student.engagement.attendance },
    { dim: "Ponctualité",   v: student.engagement.punctuality },
    { dim: "Participation", v: student.engagement.participation },
    { dim: "Autonomie",     v: student.engagement.autonomy },
    { dim: "Curiosité",     v: student.engagement.curiosity },
    { dim: "Comportement",  v: student.engagement.behavior },
    { dim: "Implication",   v: student.engagement.implication },
  ];

  const strengths = subjectsBars.slice(0, 3).map(s => s.subject);
  const weak = [...subjectsBars].reverse().slice(0, 3).map(s => s.subject);

  return (
    <PageShell
      title={`${student.firstName} ${student.lastName}`}
      badge={student.niveau + (student.serie ? ` · ${student.serie}` : "")}
      subtitle={`${school?.name} · ${student.gender === "F" ? "Fille" : "Garçon"} · né(e) en ${student.birthYear}`}
      actions={<Link to="/eleves" className="text-sm text-muted-foreground hover:underline">← Retour aux élèves</Link>}
    >
      {/* Four-dimension scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Score global" value={`${scores.global}/100`} accent="primary" />
        <KpiCard label="Académique" value={`${scores.academic}/100`} accent="accent" />
        <KpiCard label="Engagement" value={`${scores.engagement}/100`} accent="info" />
        <KpiCard label="Compétences" value={`${scores.skills}/100`} accent="info" />
        <KpiCard label="Contexte" value={`${scores.context}/100`} accent="warn" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Moyennes par matière" description={`Moyenne pondérée: ${(grades.reduce((s, g) => s + g.value * g.coefficient, 0) / Math.max(1, grades.reduce((s, g) => s + g.coefficient, 0))).toFixed(2)}/20`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectsBars} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="subject" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--ci-orange)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Progression trimestrielle" description={`Δ T3-T1 = ${progressionScore(grades).toFixed(2)} pts`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trimesterTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="trimester" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mean" stroke="var(--ci-green)" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Compétences transversales" description="Profil sur 7 axes (radar)">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={skillsRadar} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="v" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Engagement & comportement" description="7 indicateurs combinés.">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={engagementRadar} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="v" stroke="var(--ci-green)" fill="var(--ci-green)" fillOpacity={0.30} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Contexte (non pénalisant)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Distance domicile-école" v={`${student.context.distanceKm.toFixed(1)} km`} />
            <Row k="Transport" v={student.context.transport} />
            <Row k="Internet à la maison" v={student.context.internetAtHome ? "Oui" : "Non"} />
            <Row k="Livres à la maison" v={student.context.booksAtHome ? "Oui" : "Non"} />
            <Row k="Éducation des parents" v={student.context.parentsEducation} />
            <Row k="Stabilité familiale" v={`${student.context.familyStability}/100`} />
            <Row k="Indice socio-économique" v={`${student.context.socioEcoIndex}/100`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Analyses IA</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Block label="Risque de décrochage" probability={dropoutRisk.probability} confidence={dropoutRisk.confidence} explanation={dropoutRisk.explanation} positive={dropoutRisk.label === "stable"} />
            <Block label="Prédiction BEPC" probability={bepcForecast.probability} confidence={bepcForecast.confidence} explanation={bepcForecast.explanation} positive={bepcForecast.label === "reussite"} />
            <div className="border-t pt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Forces / faiblesses</div>
              <div className="flex flex-wrap gap-1">
                {strengths.map(s => <Badge key={s} className="bg-[color:var(--ci-green)]/15 text-[color:var(--ci-green)]">{s}</Badge>)}
                {weak.map(s => <Badge key={s} variant="outline" className="text-[color:var(--kpi-down)] border-[color:var(--kpi-down)]/40">{s}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return <div className="flex justify-between gap-3 border-b last:border-0 py-1"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}

function Block({ label, probability, confidence, explanation, positive }: { label: string; probability: number; confidence: number; explanation: string; positive: boolean }) {
  const c = positive ? "var(--ci-green)" : "var(--kpi-down)";
  return (
    <div className="rounded-md border-l-4 pl-3 py-1.5" style={{ borderColor: `color-mix(in oklch, ${c} 70%, transparent)` }}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide" style={{ color: c }}>{label}</span>
        <span className="text-muted-foreground">conf. {(confidence * 100).toFixed(0)}%</span>
      </div>
      <div className="text-base font-semibold tabular-nums" style={{ color: c }}>{(probability * 100).toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground mt-0.5">{explanation}</div>
    </div>
  );
}