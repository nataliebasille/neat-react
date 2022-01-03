import { random, RandomNumberGenerator } from "../../utilities";
import { Gene } from "../gene";
import { Genome } from "./genome";

export function crossover({
  alpha,
  beta,
  rng,
}: {
  alpha: Genome;
  beta: Genome;
  rng: RandomNumberGenerator;
}): Genome {
  const alphaGenes = [...alpha.genes];
  const betaGenes = [...beta.genes];
  const correlation = alphaGenes.reduce(
    (acc, gene) => {
      acc[gene.innovation] = { ...(acc[gene.innovation] ?? {}), alpha: gene };
      return acc;
    },
    betaGenes.reduce((acc, gene) => {
      acc[gene.innovation] = { beta: gene };
      return acc;
    }, {} as { [innovation: number]: { alpha?: Gene; beta?: Gene } })
  );

  const childGenes = Object.values(correlation).reduce(
    (acc, { alpha, beta }) => {
      const gene =
        alpha && beta
          ? random.getInteger(rng, 0, 2) === 0
            ? alpha
            : beta
          : alpha;

      if (gene) {
        acc.push({
          ...gene,
          enabled:
            alpha && beta && (!alpha.enabled || !beta.enabled)
              ? random.getInteger(rng, 0, 4) < 3
              : gene.enabled,
        });
      }
      return acc;
    },
    [] as Gene[]
  );

  const nodes = [...alpha.nodes];

  return {
    nodes,
    genes: childGenes,
    mutationRates: alpha.mutationRates,
  };
}
