import { crossover, Genome, mutate, NextInnovationNumber } from "../genome";
import { random, RandomNumberGenerator, range } from "../../utilities";
import { Population, PopulationSpecies } from "./types";
import { weighted } from "../../utilities/random/weighted";
import { createSpecies } from "../species/createSpecies";
import { distance } from "../species";
import { addMember } from "../species/addMember";

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
  const speciesHealth: {
    species: PopulationSpecies;
    totalAdjustedFitness: number;
    membersWithFitness: {
      genome: Genome;
      fitness: number;
      adjustedFitness: number;
    }[];
  }[] = population.species.map((species) => {
    const membersWithFitness = species.members.map((genome) => {
      const fitness = fitnessFunction(genome);
      return {
        genome,
        fitness,
        adjustedFitness: fitness / species.members.length,
      };
    });
    return {
      species,
      totalAdjustedFitness: membersWithFitness.reduce(
        (acc, { adjustedFitness }) => acc + adjustedFitness,
        0
      ),
      membersWithFitness,
    };
  });

  let survivingSpecies = speciesHealth
    .map(({ species, membersWithFitness, totalAdjustedFitness }) => {
      const surviving = membersWithFitness
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, Math.ceil(membersWithFitness.length * fitnessProportion));

      return { species, totalAdjustedFitness, surviving };
    })
    .filter((x) => x.surviving.length > 1);

  const topFitness = survivingSpecies.reduce(
    (acc, { totalAdjustedFitness }) => Math.max(acc, totalAdjustedFitness),
    0
  );

  survivingSpecies = survivingSpecies
    .map((item) => {
      if (item.totalAdjustedFitness < topFitness) {
        item.species = {
          ...item.species,
          staleness: item.species.staleness + 1,
        };
      }
      return item;
    })
    .filter((x) => x.species.staleness < maxStaleness);

  const totalAdjustedFitnessInPopulation = survivingSpecies.reduce(
    (acc, { totalAdjustedFitness }) => acc + totalAdjustedFitness,
    0
  );

  const children: Genome[] = [];

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
    survivingSpecies.reduce(
      (acc, { species }) => acc + species.members.length,
      0
    );

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
        ...createSpecies(
          surviving[0].genome,
          surviving.map((x) => x.genome).slice(1)
        ),
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
  surviving: {
    genome: Genome;
    fitness: number;
    adjustedFitness: number;
  }[]
) {
  const index = weighted(
    rng,
    surviving.map((x) => x.adjustedFitness)
  );

  const subject = surviving[index];

  const child =
    rng() < subject.genome.mutationRates.crossoverChange
      ? (() => {
          const randomIndex = random.getInteger(rng, 0, surviving.length);
          const partner = surviving[randomIndex];
          return crossover({
            alpha:
              subject.fitness > partner.fitness
                ? subject.genome
                : partner.genome,
            beta:
              subject.fitness > partner.fitness
                ? partner.genome
                : subject.genome,
            rng,
          });
        })()
      : subject.genome;

  return mutate(child, { rng, nextInnovationNumber });
}
