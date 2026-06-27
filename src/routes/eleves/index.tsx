import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { studentService } from "@/lib/services/student.service";
import { drenaService } from "@/lib/services/drena.service";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/eleves/")({
  head: () => ({ meta: [{ title: "Élèves — ONPS" }] }),
  component: StudentsList,
});

function StudentsList() {
  const top = studentService.topPerformers(200);
  const drenas = drenaService.list();
  const [q, setQ] = useState("");
  const [drenaId, setDrenaId] = useState("all");

  const list = useMemo(() => top
    .filter(s => drenaId === "all" || s.student.drenaId === drenaId)
    .filter(s => !q || `${s.student.firstName} ${s.student.lastName}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 60),
    [top, drenaId, q]);

  return (
    <PageShell title="Élèves" badge="Top performances" subtitle="200 meilleurs élèves nationaux — accéder à la fiche complète à 4 dimensions.">
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Input placeholder="Rechercher un élève…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
          <Select value={drenaId} onValueChange={setDrenaId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="DRENA" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les DRENA</SelectItem>
              {drenas.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">{list.length} affichés</div>
        </CardContent>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Élève</th>
                <th className="px-4 py-2 font-medium">Niveau</th>
                <th className="px-4 py-2 font-medium">DRENA</th>
                <th className="px-4 py-2 font-medium text-right">Score IA</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => (
                <tr key={row.student.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link to="/eleves/$id" params={{ id: row.student.id }} className="font-medium hover:underline">
                      {row.student.firstName} {row.student.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{row.student.gender === "F" ? "Fille" : "Garçon"} · né(e) {row.student.birthYear}</div>
                  </td>
                  <td className="px-4 py-2">{row.student.niveau}{row.student.serie ? ` ${row.student.serie}` : ""}</td>
                  <td className="px-4 py-2 text-muted-foreground">{drenas.find(d => d.id === row.student.drenaId)?.code}</td>
                  <td className="px-4 py-2 text-right"><Badge variant="secondary">{(row.score * 1).toFixed(1)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}