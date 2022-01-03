import { RandomNumberGenerator, range } from "../../utilities";
import { Gene } from "../gene";
import { sigmoid } from "../neuron";
import { Neuron } from "../neuron/types";
import { NextInnovationNumber } from "./types";

export type Genome = {
  readonly nodes: Neuron[];
  readonly genes: Gene[];
  readonly mutationRates: {
    readonly crossoverChange: number;
    readonly weightMutationChance: number;
    readonly weightPerturbationChance: number;
    readonly weightChangeDelta: number;
    readonly connectionAddChance: number;
    readonly nodeAddChance: number;
    readonly enableMutationChance: number;
    readonly disableMutationChance: number;
  };
};

export type CreateGenomeOptions = {
  readonly inputs: number;
  readonly outputs: number;
  readonly rng: RandomNumberGenerator;
  readonly nextInnovationNumber: NextInnovationNumber;
  readonly crossoverChange?: number;
  readonly weightMutationChance?: number;
  readonly weightPerturbationChance?: number;
  readonly weightChangeDelta?: number;
  readonly connectionAddChance?: number;
  readonly nodeAddChance?: number;
  readonly enableMutationChance?: number;
  readonly disableMutationChance?: number;
};

export function createGenone({
  inputs,
  outputs,
  rng,
  nextInnovationNumber,
  crossoverChange = 0.75,
  weightMutationChance = 0.8,
  weightPerturbationChance = 0.9,
  weightChangeDelta = 0.1,
  connectionAddChance = 2.0,
  nodeAddChance = 0.1,
  enableMutationChance = 0.6,
  disableMutationChance = 0.2,
}: CreateGenomeOptions): Genome {
  const inputNodes: Neuron[] = range(inputs).map((i) => ({
    id: i,
    type: "input",
    activationFunction: sigmoid,
  }));
  const outputNodes: Neuron[] = range(outputs).map((i) => ({
    id: i + inputs,
    type: "output",
    activationFunction: sigmoid,
  }));

  const genes = inputNodes.reduce((acc, inputNode) => {
    acc.push(
      ...outputNodes.map((outputNode) => ({
        in: inputNode.id,
        out: outputNode.id,
        weight: rng() * 4 - 2,
        innovation: nextInnovationNumber({
          in: inputNode.id,
          out: outputNode.id,
        }),
        enabled: true,
      }))
    );
    return acc;
  }, [] as Gene[]);

  return {
    nodes: [...inputNodes, ...outputNodes],
    genes,
    mutationRates: {
      weightChangeDelta,
      crossoverChange,
      weightMutationChance,
      connectionAddChance,
      weightPerturbationChance,
      nodeAddChance,
      enableMutationChance,
      disableMutationChance,
    },
  };
}
