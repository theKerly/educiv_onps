import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rapports")({
  head: () => ({ meta: [{ title: "Rapports — ONPS" }] }),
  component: ReportsPage,
});

const REPORTS = [
  { id: "regional",   title: "Rapport régional",       desc: "Synthèse par DRENA — performance, examens, alertes, classement.", icon: FileBarChart },
  { id: "school",     title: "Rapport établissement",  desc: "Fiche détaillée : effectifs, enseignants, infra, examens.", icon: FileText },
  { id: "teacher",    title: "Rapport enseignant",     desc: "Indicateurs RH pédagogiques individuels + recommandations.", icon: FileText },
  { id: "student",    title: "Rapport élève",          desc: "Profil 4-dimensions complet, prédictions IA, orientation.", icon: FileText },
  { id: "exams",      title: "Rapport examens",        desc: "Réussite BEPC/BAC par DRENA, mentions, séries.", icon: FileSpreadsheet },
  { id: "ai",         title: "Rapport IA",             desc: "Vue d'ensemble des modèles, alertes et seuils.", icon: FileBarChart },
];

const FORMATS = ["PDF", "Excel", "CSV"] as const;

function ReportsPage() {
  const trigger = (report: string, fmt: string) =>
    toast.success(`Rapport "${report}" — export ${fmt} en file d'attente`, {
      description: "L'export sera disponible dans votre espace de téléchargement.",
    });

  return (
    <PageShell title="Rapports" badge="Restitution" subtitle="Génération de rapports prêts à diffuser — PDF pour présentation, Excel/CSV pour analyses.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map(r => (
          <Card key={r.id} className="hover:shadow-md transition">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[color:var(--ci-orange)]/10 text-[color:var(--ci-orange)] p-2"><r.icon className="h-4 w-4" /></span>
                <CardTitle className="text-sm">{r.title}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">v1</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">{r.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {FORMATS.map(f => (
                  <Button key={f} size="sm" variant="outline" onClick={() => trigger(r.title, f)} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> {f}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}