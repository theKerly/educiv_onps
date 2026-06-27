# Connexion backend — PostgreSQL

Objectif : brancher votre base PostgreSQL sans toucher à l'interface utilisateur.

## Ce qu'il faut modifier

1. **Schéma DB** — exécuter les `CREATE TABLE` décrits dans `README-postgresql.md` (ou créer une migration Supabase équivalente).
2. **Couche données** — remplacer le générateur en mémoire :
   - `src/lib/data/generator.ts` → à supprimer ou conserver pour les tests.
   - `src/lib/data/index.ts` → remplacer `getDataset()` par un cache rempli depuis Supabase / votre API.
3. **Services** — adapter chacun des fichiers ci-dessous pour faire des requêtes SQL au lieu de filtrer un tableau :
   - `src/lib/services/national.service.ts`
   - `src/lib/services/drena.service.ts`
   - `src/lib/services/school.service.ts`
   - `src/lib/services/student.service.ts`
   - `src/lib/services/teacher.service.ts`

Chaque service retourne déjà des **types du domaine** (`src/lib/types/domain.ts`). Il suffit de mapper `row.snake_case` → `field.camelCase`.

## Ce qu'il NE faut PAS modifier

- `src/components/**` (UI, dashboards, cartes, graphiques).
- `src/routes/**` (pages).
- `src/lib/ai/**` (scoring, prédictions, orientation).
- `src/lib/params/index.ts` (paramètres IA — modifiables mais sans impact structurel).
- `src/lib/types/domain.ts` (contrat type).

## Pattern recommandé

```ts
// src/lib/services/student.service.ts
import { supabase } from "@/integrations/supabase/client";

export const studentService = {
  async byId(id: string) {
    const { data } = await supabase
      .from("students")
      .select("*, grades(*)")
      .eq("id", id)
      .single();
    const student = mapStudent(data);
    const grades  = data.grades.map(mapGrade);
    return {
      student,
      grades,
      scores: globalStudentScore(student, grades),
      dropoutRisk: predictDropout(student, grades),
      bepcForecast: predictBEPC(grades),
    };
  },
};
```

Convertissez les services en `async` puis adaptez les pages avec `useQuery({ queryKey, queryFn })`. Le reste de l'application n'a besoin d'aucune modification.

## Variables d'environnement

Lovable Cloud est déjà activé. Vous pouvez aussi utiliser vos propres variables :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```