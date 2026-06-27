import { generateDataset, type Dataset } from "./generator";

/**
 * Lazily-built singleton in-memory dataset.
 * Heavy preset: 12 DRENA · ~200 schools · ~10k students · ~1.5k teachers.
 */
let _dataset: Dataset | null = null;

export function getDataset(): Dataset {
  if (!_dataset) {
    _dataset = generateDataset({
      schools: 200,
      teachersPerSchool: [4, 12],
      studentsPerSchool: [35, 80],
      seed: 0xC0DE01,
    });
  }
  return _dataset;
}

export function reseedDataset(seed: number) {
  _dataset = generateDataset({
    schools: 200,
    teachersPerSchool: [4, 12],
    studentsPerSchool: [35, 80],
    seed,
  });
  return _dataset;
}