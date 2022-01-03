import { Genome } from "../genome";

export type Species = {
  readonly prototype: Genome;
  readonly members: Genome[];
  readonly staleness: number;
  readonly bestLifetimeFitness?: number;
};

export type GenomeWithFitness = Genome & {
  fitness: number;
  adjustedFitness: number;
};

export type SpeciesWithFitness = Omit<Species, "members"> & {
  readonly bestLifetimeFitness: number;
  readonly fitness: number;
  readonly members: GenomeWithFitness[];
};
