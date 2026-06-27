import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ACADEMIC_PARAMS, DROPOUT_MODEL, ENGAGEMENT_WEIGHTS, EXAM_MODEL,
  GLOBAL_DIMENSIONS, SCHOOL_RISK, UI_THRESHOLDS, YEAR_CONTRIBUTION,
} from "@/lib/params";

export const Route = createFileRoute("/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — ONPS" }] }),
  component: ParamsPage,
});

function Section({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-x-auto leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
      </CardContent>
    </Card>
  );
}

function ParamsPage() {
  return (
    <PageShell
      title="Paramètres des modèles"
      badge="Configuration"
      subtitle="Tous les coefficients, poids et seuils sont centralisés dans src/lib/params/index.ts — aucun composant ne doit contenir de constante métier."
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">src/lib/params/index.ts</Badge>
        <span>· lecture seule ici · à modifier dans le fichier source pour recompiler les calculs</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Performance académique" data={ACADEMIC_PARAMS} />
        <Section title="Engagement (poids)" data={ENGAGEMENT_WEIGHTS} />
        <Section title="Dimensions du score global" data={GLOBAL_DIMENSIONS} />
        <Section title="Année — contribution orientation" data={YEAR_CONTRIBUTION} />
        <Section title="Modèle décrochage" data={DROPOUT_MODEL} />
        <Section title="Risque établissement" data={SCHOOL_RISK} />
        <Section title="Modèle examens (BEPC/BAC)" data={EXAM_MODEL} />
        <Section title="Seuils UI" data={UI_THRESHOLDS} />
      </div>
    </PageShell>
  );
}