import {
  CreateGenomeOptions,
  createGenone,
  mutate,
  NextInnovationNumber,
} from "../genome";
import { RandomNumberGenerator, range } from "../../utilities";
import { nextInnovationNumberForPopulationFactory } from "./nextInnovationNumberForPopulationFactory";
import { distance, Species } from "../species";
import { createSpecies } from "../species/createSpecies";
import { addMember } from "../species/addMember";
import { Population, PopulationSpecies } from "./types";

type CreatePopulationOptions = CreateGenomeOptions & {
  populationSize?: number;
  speciesDistanceThreshold?: number;
  rng: RandomNumberGenerator;
  nextInnovationNumber: NextInnovationNumber;
};

export function createPopulation({
  populationSize = 150,
  speciesDistanceThreshold = 3,
  ...genomeCreationOptions
}: CreatePopulationOptions): Population {
  const { rng, nextInnovationNumber } = genomeCreationOptions;
  const populationNextInnovationNumber =
    nextInnovationNumberForPopulationFactory(nextInnovationNumber);
  const baseGenome = createGenone(genomeCreationOptions);
  const genomes = range(populationSize).map(() =>
    mutate(baseGenome, {
      rng: rng,
      nextInnovationNumber: populationNextInnovationNumber,
    })
  );

  const species: PopulationSpecies[] = genomes.reduce((acc, genome) => {
    const foundSpeciesIndex = acc.findIndex(
      (s) => distance(s, genome) < speciesDistanceThreshold
    );

    if (foundSpeciesIndex >= 0) {
      acc[foundSpeciesIndex] = {
        ...addMember(acc[foundSpeciesIndex], genome),
        staleness: 0,
      };
    } else {
      acc.push({
        ...createSpecies(genome),
        staleness: 0,
      });
    }

    return acc;
  }, [] as PopulationSpecies[]);

  return {
    generation: 1,
    populationSize,
    species,
  };
}
