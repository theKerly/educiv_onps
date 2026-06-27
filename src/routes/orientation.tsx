import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { recommendOrientation, yearContributions, type CandidateProfile } from "@/lib/ai/orientation";
import { IVORIAN_BAC_AVERAGES, SKILLS_KEYS, YEAR_CONTRIBUTION } from "@/lib/params";
import type { Serie } from "@/lib/types/domain";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const Route = createFileRoute("/orientation")({
  head: () => ({ meta: [{ title: "Orientation Post-Bac — ONPS" }] }),
  component: OrientationPage,
});

const SERIES: Serie[] = ["A", "C", "D", "G", "TI", "Pro"];
const SUBJECTS_BY_SERIE: Record<Serie, string[]> = {
  A: ["Francais", "Philosophie", "Histoire_Geographie", "Anglais", "Mathematiques", "SVT"],
  C: ["Mathematiques", "Sciences Physiques", "SVT", "Francais", "Anglais", "Philosophie"],
  D: ["Mathematiques", "Sciences Physiques", "SVT", "Francais", "Anglais", "Philosophie"],
  G: ["Economie", "Comptabilite", "Droit", "Mathematiques", "Francais", "Anglais"],
  TI: ["Mathematiques", "Sciences Physiques", "Technologie", "Francais", "Anglais"],
  Pro: ["Specialite", "Mathematiques", "Francais", "Anglais"],
};

function OrientationPage() {
  const [serie, setSerie] = useState<Serie>("D");
  const [engagement, setEngagement] = useState(70);
  const [regularity, setRegularity] = useState(70);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<{
    seconde:  Record<string, number | undefined>;
    premiere: Record<string, number | undefined>;
    terminale:Record<string, number | undefined>;
  }>({ seconde: {}, premiere: {}, terminale: {} });

  const profile: CandidateProfile = useMemo(() => ({
    serie, engagement, regularity, skills, notes,
  }), [serie, engagement, regularity, skills, notes]);

  const recos = useMemo(() => recommendOrientation(profile).slice(0, 6), [profile]);
  const contribs = yearContributions(profile);
  const cohort = IVORIAN_BAC_AVERAGES[serie] ?? {};

  const setNote = (year: "seconde" | "premiere" | "terminale", subject: string, v: string) => {
    setNotes(prev => ({
      ...prev,
      [year]: { ...prev[year], [subject]: v === "" ? undefined : Math.max(0, Math.min(20, +v)) },
    }));
  };

  return (
    <PageShell
      title="Orientation Post-Bac"
      badge="IA — Simulateur"
      subtitle="Tous les champs sont facultatifs. Le moteur fonctionne même partiellement renseigné : il pondère selon la couverture de données."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-4 items-start">
        {/* Form */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Profil du candidat</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Série Bac</Label>
                <Select value={serie} onValueChange={v => setSerie(v as Serie)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Engagement ({engagement})</Label>
                <Slider min={0} max={100} value={[engagement]} onValueChange={v => setEngagement(v[0])} className="mt-3" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Régularité ({regularity})</Label>
                <Slider min={0} max={100} value={[regularity]} onValueChange={v => setRegularity(v[0])} className="mt-3" />
              </div>
            </div>

            {(["seconde", "premiere", "terminale"] as const).map(year => (
              <div key={year}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Notes — {year} <span className="font-normal">(poids {(YEAR_CONTRIBUTION[year === "seconde" ? "Seconde" : year === "premiere" ? "Premiere" : "Terminale"] * 100).toFixed(0)}%)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS_BY_SERIE[serie].map(sub => (
                    <div key={sub}>
                      <Label className="text-[10px] text-muted-foreground">{sub.replace(/_/g, " ")} <span className="opacity-60">/20 {cohort[sub] ? `· moy. ${cohort[sub]}` : ""}</span></Label>
                      <Input type="number" min={0} max={20} step={0.5} value={notes[year][sub] ?? ""} onChange={e => setNote(year, sub, e.target.value)} className="h-8 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Compétences transversales</div>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS_KEYS.map(k => (
                  <div key={k} className="text-xs">
                    <Label className="text-[10px] text-muted-foreground capitalize">{k} ({skills[k] ?? "—"})</Label>
                    <Slider min={0} max={100} value={[skills[k] ?? 60]} onValueChange={v => setSkills(s => ({ ...s, [k]: v[0] }))} className="mt-2" />
                  </div>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => { setNotes({ seconde: {}, premiere: {}, terminale: {} }); setSkills({}); }}>
              Réinitialiser
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recommandations de filières (top 6)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recos.map(r => (
                <div key={r.filiere} className="rounded-lg border p-3 hover:bg-muted/30 transition">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold text-sm">{r.filiere}</div>
                      <div className="text-xs text-muted-foreground">{r.category} · Matières déterminantes : {r.decisiveSubjects.join(", ")}</div>
                    </div>
                    <div className="flex gap-2 items-center text-sm">
                      <Badge className="bg-[color:var(--ci-orange)]/15 text-[color:var(--ci-orange)]">Compat. {r.compatibilityScore}%</Badge>
                      <Badge className="bg-[color:var(--ci-green)]/15 text-[color:var(--ci-green)]">Réussite {(r.successProbability * 100).toFixed(0)}%</Badge>
                      <Badge variant="secondary">Conf. {(r.confidence * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                    <div><span className="font-semibold text-[color:var(--ci-green)]">Forces:</span> {r.strengths.join(", ") || "—"}</div>
                    <div><span className="font-semibold text-[color:var(--kpi-down)]">Faiblesses:</span> {r.weaknesses.join(", ") || "—"}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{r.justification}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Contribution par année</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contribs.map(c => ({ year: c.year, weight: +(c.weight * 100).toFixed(0), mean: c.mean ? +c.mean.toFixed(1) : 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="weight" fill="var(--ci-orange)" name="Poids %" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="mean"   fill="var(--ci-green)" name="Moy. /20" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Importance des matières — meilleure filière</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={(recos[0]?.variableContributions ?? []).map(c => ({ dim: c.name.replace(/_/g, " "), v: +(c.contribution * 100).toFixed(1) }))} outerRadius="75%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} tick={{ fontSize: 9 }} />
                    <Radar dataKey="v" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}