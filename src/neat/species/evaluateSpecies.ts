import { Genome } from "../genome";
import { Species, SpeciesWithFitness } from "./types";

export function evaluateSpecies(
  species: Species,
  fitnessFunction: (genome: Genome) => number
): SpeciesWithFitness {
  const members = species.members.map((genome) => {
    const fitness = fitnessFunction(genome);
    return {
      ...genome,
      fitness,
      adjustedFitness: fitness / species.members.length,
    };
  });

  const fitness = members.reduce(
    (acc, { adjustedFitness }) => acc + adjustedFitness,
    0
  );

  return {
    ...species,
    fitness: fitness,
    members,
    bestLifetimeFitness:
      species.bestLifetimeFitness === undefined
        ? fitness
        : Math.max(species.bestLifetimeFitness, fitness),
    staleness:
      species.bestLifetimeFitness === undefined ||
      fitness > species.bestLifetimeFitness
        ? 0
        : species.staleness + 1,
  };
}
