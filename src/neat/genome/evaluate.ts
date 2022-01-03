import { Genome } from "./genome";
import { Neuron } from "../neuron/types";
import { Gene } from "../gene";

export function evaluate(genome: Genome, inputs: number[]): number[] {
  if (genome.nodes.filter((x) => x.type === "input").length !== inputs.length) {
    throw new Error("Number of inputs does not match genome inputs");
  }

  const neurons = [
    // Ensuring input nodes are first to be evaluated,
    // then hidden nodes
    // then finally output nodes
    ...genome.nodes.filter((x) => x.type === "input"),
    ...genome.nodes.filter((x) => x.type === "hidden"),
    ...genome.nodes.filter((x) => x.type === "output"),
  ].map((node, index) =>
    createNeuron(node, node.type === "input" ? inputs[index] : 0)
  );

  const outputToInputsMapping = genome.genes.reduce((map, gene) => {
    if (gene.enabled) {
      if (!map[gene.out]) {
        map[gene.out] = [];
      }

      const inputNeurons = map[gene.out];
      inputNeurons.push(gene);
    }

    return map;
  }, [] as Gene[][]);

  return neurons
    .map((neuron) => {
      const relevantGenes = outputToInputsMapping[neuron.id];

      neuron.value += (relevantGenes ?? []).reduce((acc, gene) => {
        const inputNeuron = neurons.find((x) => x.id === gene.in);

        return (
          acc +
          gene.weight *
            (inputNeuron?.activationFunction(inputNeuron.value) ?? 0)
        );
      }, 0);

      return neuron;
    })
    .filter((x) => x.type === "output")
    .map((x) => x.activationFunction(x.value));
}

function createNeuron(node: Neuron, initialValue: number) {
  return {
    ...node,
    value: initialValue,
  };
}
