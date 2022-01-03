import { Species } from "../species";

export type Population = {
  readonly populationSize: number;
  readonly generation: number;
  readonly species: ReadonlyArray<PopulationSpecies>;
};

export type PopulationSpecies = Species & {
  readonly staleness: number;
};
