import { createGenone } from ".";
import { sigmoid } from "../neuron";
import { evaluate } from "./evaluate";
import { Genome } from "./genome";

describe(evaluate.name, () => {
  it(`returns activationFunction of 0 if output doesn't have any connections`, () => {
    const genome: Genome = createGenone({
      inputs: 1,
      outputs: 1,
    });

    expect(evaluate(genome, [1])).toEqual([sigmoid(0)]);
    expect(evaluate(genome, [0])).toEqual([sigmoid(0)]);
    expect(evaluate(genome, [0.5])).toEqual([sigmoid(0)]);
  });

  it("evaluate simple nueral net with 1 input and 1 output", () => {
    const genome: Genome = {
      ...createGenone({
        inputs: 1,
        outputs: 1,
      }),
      genes: [{ in: 0, out: 1, weight: 0.5, innovation: 0, enabled: true }],
    };

    expect(evaluate(genome, [0])).toEqual([sigmoid(sigmoid(0) * 0.5)]);
    expect(evaluate(genome, [1])).toEqual([sigmoid(sigmoid(1) * 0.5)]);
    expect(evaluate(genome, [0.5])).toEqual([sigmoid(sigmoid(0.5) * 0.5)]);
  });

  it("evaluates a neural net with a hidden node", () => {
    const base = createGenone({
      inputs: 1,
      outputs: 1,
    });
    const genome: Genome = {
      ...base,
      nodes: [
        ...base.nodes,
        { id: 2, type: "hidden", activationFunction: sigmoid },
      ],
      genes: [
        { in: 0, out: 2, weight: 0.25, innovation: 0, enabled: true },
        { in: 2, out: 1, weight: 0.75, innovation: 0, enabled: true },
      ],
    };

    expect(evaluate(genome, [0])).toEqual([
      sigmoid(sigmoid(sigmoid(0) * 0.25) * 0.75),
    ]);
    expect(evaluate(genome, [1])).toEqual([
      sigmoid(sigmoid(sigmoid(1) * 0.25) * 0.75),
    ]);
    expect(evaluate(genome, [0.5])).toEqual([
      sigmoid(sigmoid(sigmoid(0.5) * 0.25) * 0.75),
    ]);
  });

  it("evaluates a neural net with two inputs", () => {
    const base = createGenone({
      inputs: 2,
      outputs: 1,
    });

    const genome: Genome = {
      ...base,
      nodes: [
        ...base.nodes,
        { id: 3, type: "hidden", activationFunction: sigmoid },
      ],
      genes: [
        { in: 0, out: 3, weight: 0.25, innovation: 0, enabled: true },
        { in: 1, out: 3, weight: 0.75, innovation: 0, enabled: true },
        { in: 3, out: 2, weight: 0.5, innovation: 0, enabled: true },
      ],
    };

    expect(evaluate(genome, [0, 0])).toEqual([
      sigmoid(sigmoid(sigmoid(0) * 0.25 + sigmoid(0) * 0.75) * 0.5),
    ]);
    expect(evaluate(genome, [1, 0])).toEqual([
      sigmoid(sigmoid(sigmoid(1) * 0.25 + sigmoid(0) * 0.75) * 0.5),
    ]);
    expect(evaluate(genome, [0, 1])).toEqual([
      sigmoid(sigmoid(sigmoid(0) * 0.25 + sigmoid(1) * 0.75) * 0.5),
    ]);
    expect(evaluate(genome, [1, 1])).toEqual([
      sigmoid(sigmoid(sigmoid(1) * 0.25 + sigmoid(1) * 0.75) * 0.5),
    ]);
  });

  it("evaluates a neural net with two input and two hidden nodes", () => {
    const base = createGenone({
      inputs: 2,
      outputs: 1,
    });

    const genome: Genome = {
      ...base,
      nodes: [
        ...base.nodes,
        { id: 3, type: "hidden", activationFunction: sigmoid },
        { id: 4, type: "hidden", activationFunction: sigmoid },
      ],
      genes: [
        { in: 0, out: 3, weight: 0.1, innovation: 0, enabled: true },
        { in: 1, out: 3, weight: 0.2, innovation: 0, enabled: true },
        { in: 0, out: 4, weight: 0.3, innovation: 0, enabled: true },
        { in: 1, out: 4, weight: 0.4, innovation: 0, enabled: true },
        { in: 3, out: 2, weight: 0.5, innovation: 0, enabled: true },
        { in: 4, out: 2, weight: 0.6, innovation: 0, enabled: true },
      ],
    };

    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].forEach(([x1, x2]) => {
      const hidden1_input = sigmoid(x1) * 0.1 + sigmoid(x2) * 0.2;
      const hidden1_output = sigmoid(hidden1_input);
      const hidden2_input = sigmoid(x1) * 0.3 + sigmoid(x2) * 0.4;
      const hidden2_output = sigmoid(hidden2_input);

      const output = sigmoid(hidden1_output * 0.5 + hidden2_output * 0.6);

      expect(evaluate(genome, [x1, x2])).toEqual([output]);
    });
  });
});
