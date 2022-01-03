import { crossover, Genome, mutate, NextInnovationNumber } from "../genome";
import { random, RandomNumberGenerator, range } from "../../utilities";
import { Population, PopulationSpecies } from "./types";
import { weighted } from "../../utilities/random/weighted";
import { createSpecies } from "../species/createSpecies";
import { distance, GenomeWithFitness } from "../species";
import { addMember } from "../species/addMember";
import { evaluateSpecies } from "../species/evaluateSpecies";

type NextGenerationOptions = {
  fitnessProportion?: number;
  maxStaleness?: number;
  speciesDistanceThreshold?: number;
  rng: RandomNumberGenerator;
  nextInnovationNumber: NextInnovationNumber;
  fitness: (genome: Genome) => number;
};

export function nextGeneration(
  population: Population,
  {
    fitnessProportion = 0.2,
    maxStaleness = 15,
    speciesDistanceThreshold = 3,
    rng,
    nextInnovationNumber,
    fitness: fitnessFunction,
  }: NextGenerationOptions
): Population {
  const speciesWithFitness = population.species.map((species) =>
    evaluateSpecies(species, fitnessFunction)
  );

  let survivingSpecies = speciesWithFitness
    .map(({ members, fitness, ...species }) => {
      const surviving = members
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, Math.ceil(members.length * fitnessProportion));

      return { species, totalAdjustedFitness: fitness, surviving };
    })
    .filter(
      (x) => x.species.staleness < maxStaleness && x.surviving.length > 1
    );

  const totalAdjustedFitnessInPopulation = survivingSpecies.reduce(
    (acc, { totalAdjustedFitness }) => acc + totalAdjustedFitness,
    0
  );

  const children: Genome[] = [
    ...survivingSpecies
      .filter((x) => x.surviving.length >= 5)
      .map((x) => x.surviving[0]),
  ];

  for (const { surviving, totalAdjustedFitness } of survivingSpecies) {
    const numberOfChildren =
      Math.floor(
        population.populationSize *
          (totalAdjustedFitness / totalAdjustedFitnessInPopulation)
      ) - 1;

    for (let i = 0; i < numberOfChildren; i++) {
      children.push(breed(rng, nextInnovationNumber, surviving));
    }
  }

  const currentTotal =
    children.length +
    survivingSpecies.reduce((acc, { surviving }) => acc + surviving.length, 0);

  for (let i = currentTotal; i < population.populationSize; i++) {
    const index = random.getInteger(rng, 0, survivingSpecies.length);
    children.push(
      breed(rng, nextInnovationNumber, survivingSpecies[index].surviving)
    );
  }

  const nextSpecies = children.reduce(
    (acc, genome) => {
      const foundSpeciesIndex = acc.findIndex(
        (s) => distance(s, genome) < speciesDistanceThreshold
      );

      if (foundSpeciesIndex >= 0) {
        acc[foundSpeciesIndex] = {
          ...addMember(acc[foundSpeciesIndex], genome),
          staleness: acc[foundSpeciesIndex].staleness,
        };
      } else {
        acc.push({
          ...createSpecies(genome),
          staleness: 0,
        });
      }

      return acc;
    },
    survivingSpecies.map(({ species, surviving }) => {
      return {
        ...createSpecies(surviving[0], surviving.slice(1)),
        staleness: species.staleness,
      };
    })
  );

  return {
    ...population,
    generation: population.generation + 1,
    species: nextSpecies,
  };
}

function breed(
  rng: RandomNumberGenerator,
  nextInnovationNumber: NextInnovationNumber,
  surviving: GenomeWithFitness[]
) {
  const index = weighted(
    rng,
    surviving.map((x) => x.adjustedFitness)
  );

  const subject = surviving[index];

  const child =
    rng() < subject.mutationRates.crossoverChange
      ? (() => {
          const randomIndex = random.getInteger(rng, 0, surviving.length);
          const partner = surviving[randomIndex];
          return crossover({
            alpha: subject.fitness > partner.fitness ? subject : partner,
            beta: subject.fitness > partner.fitness ? partner : subject,
            rng,
          });
        })()
      : subject;

  return mutate(child, { rng, nextInnovationNumber });
}
