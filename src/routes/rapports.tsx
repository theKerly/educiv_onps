import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, FileSpreadsheet, FileBarChart, Download, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { nationalService } from "@/lib/services/national.service";
import { drenaService } from "@/lib/services/drena.service";
import { schoolService } from "@/lib/services/school.service";
import { studentService } from "@/lib/services/student.service";
import { teacherService } from "@/lib/services/teacher.service";

export const Route = createFileRoute("/rapports")({
  head: () => ({ meta: [{ title: "Rapports — ONPS" }] }),
  component: ReportsPage,
});

type ReportId = "regional" | "school" | "teacher" | "student" | "exams" | "ai";

const REPORTS: Array<{ id: ReportId; title: string; desc: string; icon: typeof FileText }> = [
  { id: "regional", title: "Rapport régional",      desc: "Synthèse par DRENA — performance, examens, alertes, classement.", icon: FileBarChart },
  { id: "school",   title: "Rapport établissement", desc: "Top établissements, infra, taux de réussite agrégés.", icon: FileText },
  { id: "teacher",  title: "Rapport enseignant",    desc: "Indicateurs RH pédagogiques + accompagnement recommandé.", icon: FileText },
  { id: "student",  title: "Rapport élève",         desc: "Top performances, progressions, prédictions IA.", icon: FileText },
  { id: "exams",    title: "Rapport examens",       desc: "Réussite BEPC/BAC nationale et régionale.", icon: FileSpreadsheet },
  { id: "ai",       title: "Rapport IA",            desc: "Vue d'ensemble des modèles, cohortes, équité.", icon: FileBarChart },
];

const FORMATS = ["PDF", "Excel", "CSV"] as const;
type Format = (typeof FORMATS)[number];

const SCHOOL_YEARS = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"] as const;
type SchoolYear = (typeof SCHOOL_YEARS)[number];

/* --------------- Report preview builders --------------- */

interface PreviewTable { columns: string[]; rows: (string | number)[][]; }
interface PreviewSection { heading: string; kind: "kpis" | "table"; kpis?: { label: string; value: string }[]; table?: PreviewTable; }
interface PreviewDoc { title: string; year: SchoolYear; subtitle: string; sections: PreviewSection[]; }

const pct = (n: number) => `${(n * 100).toFixed(1)} %`;
const num = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

function buildPreview(report: ReportId, year: SchoolYear): PreviewDoc {
  const meta = REPORTS.find(r => r.id === report)!;
  switch (report) {
    case "regional": {
      const k = nationalService.kpis();
      const ranking = drenaService.ranking().slice(0, 12);
      return {
        title: meta.title, year, subtitle: "Performance comparée des 12 DRENA",
        sections: [
          { heading: "Indicateurs nationaux", kind: "kpis", kpis: [
            { label: "Performance moyenne", value: k.performanceAvg.toFixed(1) },
            { label: "Réussite BEPC", value: pct(k.successRateBepc) },
            { label: "Réussite BAC", value: pct(k.successRateBac) },
            { label: "Assiduité moyenne", value: `${k.attendanceAvg.toFixed(1)} %` },
          ]},
          { heading: "Classement des DRENA", kind: "table", table: {
            columns: ["Rang", "DRENA", "Région", "Établissements", "Perf.", "BEPC", "BAC"],
            rows: ranking.map((r, i) => [i + 1, r.drena.name, r.drena.region, r.schools, r.performanceAvg.toFixed(1), pct(r.successBepc), pct(r.successBac)]),
          }},
        ],
      };
    }
    case "school": {
      const top = schoolService.topPerforming(15);
      const risk = schoolService.atRisk(10);
      return {
        title: meta.title, year, subtitle: "Top établissements et profils à risque",
        sections: [
          { heading: "Top 15 établissements", kind: "table", table: {
            columns: ["#", "Établissement", "Cycle", "Élèves", "Enseignants", "Score"],
            rows: top.map((s, i) => [i + 1, s.name, s.cycle, s.studentCount, s.teacherCount, s.performanceScore.toFixed(1)]),
          }},
          { heading: "Établissements à risque", kind: "table", table: {
            columns: ["Établissement", "Cycle", "Probabilité", "Élèves"],
            rows: risk.map(r => [r.school.name, r.school.cycle, pct(r.risk.probability), r.school.studentCount]),
          }},
        ],
      };
    }
    case "teacher": {
      const top = teacherService.topPerforming(15);
      const support = teacherService.needingSupport(10);
      return {
        title: meta.title, year, subtitle: "Performance pédagogique & accompagnement",
        sections: [
          { heading: "Top enseignants", kind: "table", table: {
            columns: ["#", "Nom", "Matière", "Expérience", "Score"],
            rows: top.map((t, i) => [i + 1, `${t.teacher.firstName} ${t.teacher.lastName}`, t.teacher.subjectMain, `${t.teacher.yearsExperience} ans`, t.score.toFixed(1)]),
          }},
          { heading: "Accompagnement recommandé", kind: "table", table: {
            columns: ["Nom", "Matière", "Probabilité", "Diplôme"],
            rows: support.map(s => [`${s.teacher.firstName} ${s.teacher.lastName}`, s.teacher.subjectMain, pct(s.support.probability), s.teacher.diploma]),
          }},
        ],
      };
    }
    case "student": {
      const top = studentService.topPerformers(20);
      return {
        title: meta.title, year, subtitle: "Top performances annuelles",
        sections: [
          { heading: "Top 20 élèves", kind: "table", table: {
            columns: ["#", "Nom", "Niveau", "Genre", "Score"],
            rows: top.map((s, i) => [i + 1, `${s.student.firstName} ${s.student.lastName}`, s.student.niveau, s.student.gender, s.score.toFixed(1)]),
          }},
        ],
      };
    }
    case "exams": {
      const k = nationalService.kpis();
      const ranking = drenaService.ranking();
      return {
        title: meta.title, year, subtitle: `Session ${year.split("-")[1]} — BEPC & BAC`,
        sections: [
          { heading: "Synthèse nationale", kind: "kpis", kpis: [
            { label: "Candidats (estim.)", value: num(k.studentTotal * 0.18) },
            { label: "Réussite BEPC", value: pct(k.successRateBepc) },
            { label: "Réussite BAC", value: pct(k.successRateBac) },
            { label: "Parité F/M", value: pct(k.genderParity) },
          ]},
          { heading: "Réussite par DRENA", kind: "table", table: {
            columns: ["DRENA", "BEPC", "BAC", "Assiduité"],
            rows: ranking.map(r => [r.drena.name, pct(r.successBepc), pct(r.successBac), `${r.attendanceAvg.toFixed(1)} %`]),
          }},
        ],
      };
    }
    case "ai": {
      const k = nationalService.kpis();
      return {
        title: meta.title, year, subtitle: "Modèles IA & alertes",
        sections: [
          { heading: "État des modèles", kind: "kpis", kpis: [
            { label: "Élèves analysés", value: num(k.studentTotal) },
            { label: "Décrochage moyen", value: pct(k.dropoutRate) },
            { label: "Établissements à risque", value: num(schoolService.atRisk(500).length) },
            { label: "Enseignants à accompagner", value: num(teacherService.needingSupport(500).length) },
          ]},
          { heading: "Modèles actifs", kind: "table", table: {
            columns: ["Modèle", "Type", "Variables", "Statut"],
            rows: [
              ["Décrochage scolaire", "Régression logistique", 7, "Actif"],
              ["Prédiction BEPC", "Moyenne pondérée + logistique", 8, "Actif"],
              ["Prédiction BAC", "Moyenne pondérée + logistique", 8, "Actif"],
              ["Risque établissement", "Score composite", 5, "Actif"],
              ["Orientation Post-Bac", "Compatibilité multi-critères", 12, "Actif"],
              ["Cohortes (k-means)", "Clustering", 4, "Actif"],
            ],
          }},
        ],
      };
    }
  }
}

/* --------------- Download (real CSV, mocked PDF/Excel) --------------- */

function downloadCsv(doc: PreviewDoc) {
  const lines: string[] = [`${doc.title};${doc.year}`, doc.subtitle, ""];
  for (const s of doc.sections) {
    lines.push(`# ${s.heading}`);
    if (s.kind === "kpis" && s.kpis) {
      lines.push("Indicateur;Valeur");
      for (const k of s.kpis) lines.push(`${k.label};${k.value}`);
    }
    if (s.kind === "table" && s.table) {
      lines.push(s.table.columns.join(";"));
      for (const row of s.table.rows) lines.push(row.map(c => String(c).replace(/;/g, ",")).join(";"));
    }
    lines.push("");
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title.replace(/\s+/g, "_")}_${doc.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------- UI --------------- */

function ReportsPage() {
  const [year, setYear] = useState<SchoolYear>("2024-2025");
  const [preview, setPreview] = useState<ReportId | null>(null);

  const doc = useMemo(() => (preview ? buildPreview(preview, year) : null), [preview, year]);

  const handleDownload = (fmt: Format) => {
    if (!doc) return;
    if (fmt === "CSV") {
      downloadCsv(doc);
      toast.success(`Export CSV "${doc.title}" généré`, { description: `Année ${doc.year}` });
      return;
    }
    toast.success(`Rapport "${doc.title}" — export ${fmt} en file d'attente`, {
      description: `Année ${doc.year} — disponible dans votre espace de téléchargement.`,
    });
  };

  return (
    <PageShell
      title="Rapports"
      badge="Restitution"
      subtitle="Sélectionnez une année scolaire, prévisualisez le rapport puis téléchargez le format souhaité."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Année scolaire</span>
          <Select value={year} onValueChange={(v) => setYear(v as SchoolYear)}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map(r => (
          <Card key={r.id} className="hover:shadow-md transition flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[color:var(--ci-orange)]/10 text-[color:var(--ci-orange)] p-2"><r.icon className="h-4 w-4" /></span>
                <CardTitle className="text-sm">{r.title}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">{year}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between gap-3">
              <p className="text-xs text-muted-foreground">{r.desc}</p>
              <Button size="sm" onClick={() => setPreview(r.id)} className="gap-1.5 w-full">
                <Eye className="h-3.5 w-3.5" /> Aperçu & téléchargement
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {doc?.title}
              <Badge variant="outline">{doc?.year}</Badge>
            </DialogTitle>
            <DialogDescription>{doc?.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {doc && (
              <div className="bg-white text-black rounded-md border p-6 space-y-6 print:shadow-none">
                <header className="border-b pb-3">
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--ci-orange)] font-semibold">
                    Observatoire National de la Performance Scolaire
                  </div>
                  <h2 className="text-xl font-bold mt-1">{doc.title}</h2>
                  <div className="text-xs text-gray-600">{doc.subtitle} • Année scolaire {doc.year}</div>
                </header>

                {doc.sections.map((s, i) => (
                  <section key={i} className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800">{s.heading}</h3>
                    {s.kind === "kpis" && s.kpis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {s.kpis.map((k, j) => (
                          <div key={j} className="border rounded-md p-3">
                            <div className="text-[10px] uppercase tracking-wide text-gray-500">{k.label}</div>
                            <div className="text-lg font-bold text-gray-900 mt-0.5">{k.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {s.kind === "table" && s.table && (
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {s.table.columns.map((c, j) => (
                                <TableHead key={j} className="text-[11px] uppercase tracking-wide text-gray-700">{c}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {s.table.rows.slice(0, 25).map((row, ri) => (
                              <TableRow key={ri}>
                                {row.map((cell, ci) => (
                                  <TableCell key={ci} className="text-xs py-2">{cell}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {s.table.rows.length > 25 && (
                          <div className="text-[11px] text-gray-500 px-3 py-2 border-t">
                            … {s.table.rows.length - 25} ligne(s) supplémentaire(s) dans l'export complet.
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                ))}

                <Separator />
                <footer className="text-[10px] text-gray-500 flex justify-between">
                  <span>Généré par ONPS — données simulées</span>
                  <span>{new Date().toLocaleDateString("fr-FR")}</span>
                </footer>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Imprimer
            </Button>
            <div className="flex gap-2">
              {FORMATS.map(f => (
                <Button key={f} size="sm" variant={f === "CSV" ? "default" : "outline"} onClick={() => handleDownload(f)} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> {f}
                </Button>
              ))}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}