# Schéma PostgreSQL — ONPS

Description normalisée des tables. Les noms de colonnes suivent `snake_case`. Toutes les `PRIMARY KEY` sont en `text` (UUID ou identifiant fonctionnel ; libre à vous d'adopter `uuid` ou `bigserial`).

## drenas
| Colonne | Type | Contraintes |
|---|---|---|
| id | text | PK |
| code | text | UNIQUE, NOT NULL |
| name | text | NOT NULL |
| region | text | NOT NULL |
| lat | double precision | |
| lng | double precision | |
| population | integer | |

## schools
| Colonne | Type | Contraintes |
|---|---|---|
| id | text | PK |
| name | text | NOT NULL |
| drena_id | text | FK → drenas(id), NOT NULL |
| type | text | CHECK (`public`,`prive_laique`,`prive_confessionnel`) |
| cycle | text | CHECK (`primaire`,`college`,`lycee`) |
| city | text | |
| student_count | integer | DEFAULT 0 |
| teacher_count | integer | DEFAULT 0 |
| classroom_count | integer | DEFAULT 0 |
| has_internet | boolean | DEFAULT false |
| has_library | boolean | DEFAULT false |
| has_electricity | boolean | DEFAULT false |
| has_water | boolean | DEFAULT false |
| founded_year | integer | |
| performance_score | numeric(5,2) | composite (calculé) |

## classes
| Colonne | Type | Contraintes |
|---|---|---|
| id | text | PK |
| school_id | text | FK → schools(id) |
| niveau | text | CHECK (`CP1`…`Tle`) |
| serie | text | NULL, CHECK (`A`,`C`,`D`,`G`,`TI`,`Pro`) |
| label | text | |
| student_count | integer | DEFAULT 0 |
| main_teacher_id | text | FK → teachers(id) |

## teachers
| Colonne | Type | Contraintes |
|---|---|---|
| id | text | PK |
| first_name | text | |
| last_name | text | |
| school_id | text | FK → schools(id) |
| subject_main | text | |
| years_experience | integer | |
| diploma | text | CHECK (`CAFOP`,`Licence`,`Master`,`Doctorat`) |
| maitrise_savoirs | numeric(5,2) | 0–100 |
| ethique | numeric(5,2) | 0–100 |
| exemplarite | numeric(5,2) | 0–100 |
| gestion_classe | numeric(5,2) | 0–100 |
| capacite_remediation | numeric(5,2) | 0–100 |
| efficacite_pedagogique | numeric(5,2) | 0–100 |
| progression_eleves | numeric(5,2) | 0–100 |

## students
| Colonne | Type | Contraintes |
|---|---|---|
| id | text | PK |
| first_name | text | |
| last_name | text | |
| gender | text | CHECK (`M`,`F`) |
| birth_year | integer | |
| class_id | text | FK → classes(id) |
| school_id | text | FK → schools(id) |
| drena_id | text | FK → drenas(id) |
| niveau | text | |
| serie | text | NULL |
| context_distance_km | numeric(5,2) | |
| context_transport | text | CHECK (`marche`,`velo`,`bus`,`voiture`) |
| context_internet | boolean | |
| context_books | boolean | |
| context_parents_education | text | |
| context_family_stability | numeric(5,2) | 0–100 |
| context_socio_eco_index | numeric(5,2) | 0–100 |
| engagement_attendance | numeric(5,2) | 0–100 |
| engagement_punctuality | numeric(5,2) | 0–100 |
| engagement_participation | numeric(5,2) | 0–100 |
| engagement_autonomy | numeric(5,2) | 0–100 |
| engagement_curiosity | numeric(5,2) | 0–100 |
| engagement_behavior | numeric(5,2) | 0–100 |
| engagement_implication | numeric(5,2) | 0–100 |
| skills_esprit_critique | numeric(5,2) | 0–100 |
| skills_communication | numeric(5,2) | 0–100 |
| skills_creativite | numeric(5,2) | 0–100 |
| skills_collaboration | numeric(5,2) | 0–100 |
| skills_leadership | numeric(5,2) | 0–100 |
| skills_resilience | numeric(5,2) | 0–100 |
| skills_adaptation | numeric(5,2) | 0–100 |

## grades
| Colonne | Type | Contraintes |
|---|---|---|
| id | bigserial | PK |
| student_id | text | FK → students(id) |
| school_year | text | ex. `2024-2025` |
| trimester | smallint | 1/2/3 |
| subject | text | |
| value | numeric(4,2) | /20 |
| coefficient | numeric(3,1) | |
| appreciation | text | NULL |

## exam_results
| Colonne | Type | Contraintes |
|---|---|---|
| id | bigserial | PK |
| student_id | text | FK → students(id) |
| exam | text | CHECK (`BEPC`,`BAC`,`CEPE`) |
| year | integer | |
| mention | text | |
| average | numeric(4,2) | |
| passed | boolean | |

## Tables connexes recommandées (à matérialiser selon vos besoins)

- `subjects(id, name, coefficient_default)`
- `attendance(id, student_id, date, status)`
- `sanctions(id, student_id, date, type, severity)`
- `rewards(id, student_id, date, type)`
- `infrastructures(id, school_id, type, status)`
- `users(id, email, role)` + `roles(id, name, permissions)`
- `ai_predictions(id, target_type, target_id, model, probability, confidence, payload jsonb, created_at)`
- `ai_models(id, name, version, params jsonb, updated_at)`
- `ai_recommendations(id, target_type, target_id, category, text, score, created_at)`
- `reports(id, type, params jsonb, status, file_url, created_at)`
- `indicator_history(id, scope_type, scope_id, key, value, recorded_at)`

## Index conseillés

```sql
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_drena ON students(drena_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_exams_student ON exam_results(student_id);
CREATE INDEX idx_schools_drena ON schools(drena_id);
CREATE INDEX idx_teachers_school ON teachers(school_id);
```