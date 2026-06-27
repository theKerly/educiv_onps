import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { schoolService } from "@/lib/services/school.service";
import { drenaService } from "@/lib/services/drena.service";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UI_THRESHOLDS } from "@/lib/params";

export const Route = createFileRoute("/etablissements/")({
  head: () => ({ meta: [{ title: "Établissements — ONPS" }] }),
  component: SchoolsList,
});

function SchoolsList() {
  const all = schoolService.list();
  const drenas = drenaService.list();
  const [q, setQ] = useState("");
  const [drenaId, setDrenaId] = useState<string>("all");
  const [cycle, setCycle] = useState<string>("all");

  const list = useMemo(() => {
    return all
      .filter(s => drenaId === "all" || s.drenaId === drenaId)
      .filter(s => cycle === "all" || s.cycle === cycle)
      .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.city.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 80);
  }, [all, q, drenaId, cycle]);

  const badge = (v: number) => {
    if (v >= UI_THRESHOLDS.excellent) return <Badge className="bg-[color:var(--ci-green)]/15 text-[color:var(--ci-green)] hover:bg-[color:var(--ci-green)]/20">{v.toFixed(0)}</Badge>;
    if (v >= UI_THRESHOLDS.good)      return <Badge className="bg-[color:var(--kpi-info)]/15 text-[color:var(--kpi-info)] hover:bg-[color:var(--kpi-info)]/20">{v.toFixed(0)}</Badge>;
    if (v >= UI_THRESHOLDS.warning)   return <Badge className="bg-[color:var(--kpi-warn)]/15 text-[color:var(--kpi-warn)] hover:bg-[color:var(--kpi-warn)]/20">{v.toFixed(0)}</Badge>;
    return <Badge className="bg-[color:var(--kpi-down)]/15 text-[color:var(--kpi-down)] hover:bg-[color:var(--kpi-down)]/20">{v.toFixed(0)}</Badge>;
  };

  return (
    <PageShell title="Établissements" badge="Annuaire" subtitle={`${all.length} établissements répertoriés — filtrer par DRENA, cycle ou nom.`}>
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Input placeholder="Rechercher un établissement…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
          <Select value={drenaId} onValueChange={setDrenaId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="DRENA" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les DRENA</SelectItem>
              {drenas.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cycle} onValueChange={setCycle}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cycle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous cycles</SelectItem>
              <SelectItem value="primaire">Primaire</SelectItem>
              <SelectItem value="college">Collège</SelectItem>
              <SelectItem value="lycee">Lycée</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">{list.length} résultats (80 max affichés)</div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Établissement</th>
                <th className="px-4 py-2 font-medium">DRENA</th>
                <th className="px-4 py-2 font-medium">Cycle</th>
                <th className="px-4 py-2 font-medium text-right">Élèves</th>
                <th className="px-4 py-2 font-medium text-right">Enseignants</th>
                <th className="px-4 py-2 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => {
                const drena = drenas.find(d => d.id === s.drenaId);
                return (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Link to="/etablissements/$id" params={{ id: s.id }} className="font-medium hover:underline">{s.name}</Link>
                      <div className="text-xs text-muted-foreground">{s.city}</div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{drena?.code}</td>
                    <td className="px-4 py-2 capitalize">{s.cycle}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{s.studentCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{s.teacherCount}</td>
                    <td className="px-4 py-2 text-right">{badge(s.performanceScore)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}