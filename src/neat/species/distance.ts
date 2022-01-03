import { Genome } from "../genome";
import { Species } from "./types";

type DistanceOptions = {
  readonly excessGeneCoefficient: number;
  readonly disjointGeneCoefficient: number;
  readonly weightDifferenceCoefficient: number;
};
export function distance(
  species: Species,
  genome: Genome,
  {
    excessGeneCoefficient,
    disjointGeneCoefficient,
    weightDifferenceCoefficient,
  }: DistanceOptions = {
    excessGeneCoefficient: 1,
    disjointGeneCoefficient: 1,
    weightDifferenceCoefficient: 0.4,
  }
): number {
  const numberOfGenes = Math.max(
    species.prototype.genes.length,
    genome.genes.length,
    1
  );

  const maxSpeciesPrototypeInnovationNumber = species.prototype.genes.reduce(
    (acc, gene) => Math.max(acc, gene.innovation),
    0
  );
  const maxGenomeInnovationNumber = genome.genes.reduce(
    (acc, gene) => Math.max(acc, gene.innovation),
    0
  );

  const minInnovation = Math.max(
    maxSpeciesPrototypeInnovationNumber,
    maxGenomeInnovationNumber
  );

  const excessGeneCount =
    maxSpeciesPrototypeInnovationNumber > minInnovation
      ? species.prototype.genes.filter((x) => x.innovation > minInnovation)
          .length
      : genome.genes.filter((x) => x.innovation > minInnovation).length;

  const disjointGeneCount = [...species.prototype.genes, ...genome.genes]
    .filter((x) => x.innovation <= minInnovation)
    .reduce((acc, gene, index, all) => {
      return (
        acc +
        (!all.some((x, innerIndex) => {
          return index !== innerIndex && x.innovation === gene.innovation;
        })
          ? 1
          : 0)
      );
    }, 0);

  const weightDifference = species.prototype.genes.reduce((acc, gene) => {
    const otherGene = genome.genes.find(
      (x) => x.innovation === gene.innovation
    );

    return acc + (otherGene ? Math.abs(gene.weight - otherGene.weight) : 0);
  }, 0);

  const count = numberOfGenes < 20 ? 1 : numberOfGenes;

  return (
    (excessGeneCoefficient * excessGeneCount) / count +
    (disjointGeneCoefficient * disjointGeneCount) / count +
    weightDifferenceCoefficient * weightDifference
  );
}
