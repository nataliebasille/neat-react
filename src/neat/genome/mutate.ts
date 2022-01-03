import { Neuron } from "../neuron/types";
import { pipe, random, RandomNumberGenerator, range } from "../../utilities";
import { Gene } from "../gene";
import { Genome } from "./genome";
import { NextInnovationNumber } from "./types";
import { sigmoid } from "../neuron";

type MutationOptions = {
  readonly rng: RandomNumberGenerator;
  readonly nextInnovationNumber: NextInnovationNumber;
};

export function mutate(
  genome: Genome,
  { rng, nextInnovationNumber }: MutationOptions
): Genome {
  return pipe(
    tryMutation.bind(
      null,
      rng,
      genome.mutationRates.weightMutationChance,
      mutateWeights.bind(null, rng)
    ),
    tryMutation.bind(
      null,
      rng,
      genome.mutationRates.connectionAddChance,
      tryAddConnection.bind(null, rng, nextInnovationNumber)
    ),
    tryMutation.bind(
      null,
      rng,
      genome.mutationRates.nodeAddChance,
      tryAddNode.bind(null, rng, nextInnovationNumber)
    ),
    tryMutation.bind(
      null,
      rng,
      genome.mutationRates.enableMutationChance,
      tryEnableMutation.bind(null, rng)
    ),
    tryMutation.bind(
      null,
      rng,
      genome.mutationRates.disableMutationChance,
      tryDisableMutation.bind(null, rng)
    )
  )(genome);
}

function mutateMutationRates(
  rng: RandomNumberGenerator,
  genome: Genome
): Genome {
  return {
    ...genome,
    mutationRates: Object.keys(genome.mutationRates).reduce((acc, key) => {
      (acc as any)[key] *= random.getInteger(rng, 0, 2) ? 1.05 : 0.95;
      return acc;
    }, genome.mutationRates),
  };
}

function mutateWeights(rng: RandomNumberGenerator, genome: Genome): Genome {
  if (genome.genes.length === 0) return genome;

  const genes = genome.genes.map((gene) => ({
    ...gene,
    weight:
      rng() < genome.mutationRates.weightPerturbationChance
        ? gene.weight +
          rng() * genome.mutationRates.weightChangeDelta * 2 -
          genome.mutationRates.weightChangeDelta
        : rng() * 4 - 2,
  }));

  return {
    ...genome,
    genes,
  };
}

function tryAddConnection(
  rng: RandomNumberGenerator,
  nextInnovationNumber: NextInnovationNumber,
  genome: Genome
): Genome {
  const { nodes, genes } = genome;

  const nodeIndex1 = random.getInteger(rng, 0, nodes.length);
  const nodeIndex2 = random.getInteger(rng, 0, nodes.length);

  if (nodeIndex1 === nodeIndex2) return genome;

  const node1 = nodes[nodeIndex1];
  const node2 = nodes[nodeIndex2];

  if (node1.type === "input" && node2.type === "input") return genome;

  const inputNode = node2.type === "input" ? node2 : node1;
  const outputNode = node2.type === "input" ? node1 : node2;

  if (
    genes.find((gene) => gene.in === inputNode.id && gene.out === outputNode.id)
  ) {
    // Connection already exists
    return genome;
  }

  const weight = rng() * 4 - 2;

  return {
    ...genome,
    genes: [
      ...genome.genes,
      {
        in: inputNode.id,
        out: outputNode.id,
        weight,
        innovation: nextInnovationNumber({
          in: inputNode.id,
          out: outputNode.id,
        }),
        enabled: true,
      },
    ],
  };
}

function tryAddNode(
  rng: RandomNumberGenerator,
  nextInnovationNumber: NextInnovationNumber,
  genome: Genome
): Genome {
  const { genes } = genome;

  if (genes.length === 0) return genome;

  const geneIndex = random.getInteger(rng, 0, genes.length);
  const gene = { ...genes[geneIndex] };

  if (!gene.enabled) return genome;

  gene.enabled = false;

  const copiedGenes = [...genes];
  copiedGenes[geneIndex] = gene;

  const nodes: Neuron[] = [
    ...genome.nodes,
    {
      id: nextNeuronId(genome.nodes),
      type: "hidden",
      activationFunction: sigmoid,
    },
  ];
  const newNodeId = nodes[nodes.length - 1].id;

  const gene1: Gene = {
    in: gene.in,
    out: newNodeId,
    weight: 1.0,
    innovation: nextInnovationNumber({ in: gene.in, out: newNodeId }),
    enabled: true,
  };
  const gene2: Gene = {
    in: newNodeId,
    out: gene.out,
    weight: gene.weight,
    innovation: nextInnovationNumber({ in: newNodeId, out: gene.out }),
    enabled: true,
  };

  copiedGenes.push(gene1, gene2);

  return {
    ...genome,
    nodes,
    genes: copiedGenes,
  };
}

function tryEnableMutation(rng: RandomNumberGenerator, genome: Genome) {
  const genes = [...genome.genes];

  const candidates = genes.reduce((acc, gene, index) => {
    if (!gene.enabled) {
      acc.push({
        index,
        gene,
      });
    }

    return acc;
  }, [] as { index: number; gene: Gene }[]);

  if (candidates.length === 0) return genome;

  const { index, gene } =
    candidates[random.getInteger(rng, 0, candidates.length)];

  genes[index] = {
    ...gene,
    enabled: true,
  };

  return {
    ...genome,
    genes,
  };
}

function tryDisableMutation(rng: RandomNumberGenerator, genome: Genome) {
  const genes = [...genome.genes];

  const candidates = genes.reduce((acc, gene, index) => {
    if (gene.enabled) {
      acc.push({
        index,
        gene,
      });
    }

    return acc;
  }, [] as { index: number; gene: Gene }[]);

  if (candidates.length === 0) return genome;

  const { index, gene } =
    candidates[random.getInteger(rng, 0, candidates.length)];

  genes[index] = {
    ...gene,
    enabled: false,
  };

  return {
    ...genome,
    genes,
  };
}

function tryMutation(
  rng: RandomNumberGenerator,
  mutationRate: number,
  mutateAction: (genome: Genome) => Genome,
  genome: Genome
) {
  return range(Math.ceil(mutationRate)).reduce((genome, index) => {
    if (rng() > mutationRate - index) {
      return genome;
    }

    return mutateAction(genome);
  }, genome);
}

function nextNeuronId(nodes: Neuron[]): number {
  return nodes.reduce((acc, node) => Math.max(acc, node.id), 0) + 1;
}
