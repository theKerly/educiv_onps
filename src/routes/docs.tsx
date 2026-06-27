import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Database, FileCode, Brain, Server, ListTree } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Documentation — ONPS" }] }),
  component: DocsPage,
});

const DOCS = [
  { file: "docs/README.md",              icon: BookOpen, title: "README principal",       desc: "Architecture générale, conventions, organisation des dossiers, démarrage." },
  { file: "docs/README-postgresql.md",   icon: Database, title: "Schéma PostgreSQL",      desc: "Tables, colonnes, types SQL, clés primaires/étrangères, relations." },
  { file: "docs/README-fields.md",       icon: ListTree, title: "Champs par vue",         desc: "Pour chaque page, les tables et champs nécessaires (obligatoires / facultatifs)." },
  { file: "docs/README-calculations.md", icon: FileCode, title: "Calculs & formules",     desc: "Fonctions, entrées, sorties, formules — score académique, engagement, etc." },
  { file: "docs/README-ia.md",           icon: Brain,    title: "Intelligence artificielle", desc: "Paramètres, pondérations, seuils, variables, logique des scores." },
  { file: "docs/README-backend.md",      icon: Server,   title: "Backend & connexion DB", desc: "Fichiers à modifier pour brancher PostgreSQL, services à remplacer." },
];

function DocsPage() {
  return (
    <PageShell title="Documentation" badge="Référence" subtitle="Six documents — couvrant architecture, base de données, formules, IA et connexion backend.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DOCS.map(d => (
          <Card key={d.file} className="hover:shadow-md transition">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[color:var(--ci-orange)]/10 text-[color:var(--ci-orange)] p-2"><d.icon className="h-4 w-4" /></span>
                <CardTitle className="text-sm">{d.title}</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">{d.file}</Badge>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{d.desc}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Démarche de connexion à votre base PostgreSQL</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong className="text-foreground">1.</strong> Adapter les schémas dans <code>supabase/migrations</code> ou utiliser le fichier <code>docs/README-postgresql.md</code> comme référence.</p>
          <p><strong className="text-foreground">2.</strong> Remplacer le générateur en mémoire (<code>src/lib/data/</code>) par des appels Supabase / API REST dans <code>src/lib/services/*.service.ts</code>.</p>
          <p><strong className="text-foreground">3.</strong> Les composants React et les fichiers de paramètres IA ne doivent pas être modifiés.</p>
          <p><strong className="text-foreground">4.</strong> Vérifier la correspondance des champs via <code>docs/README-fields.md</code>.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}