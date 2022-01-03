export type Neuron = {
  readonly id: number;
  readonly type: "input" | "hidden" | "output";
  readonly activationFunction: ActivationFunction;
};

export type ActivationFunction = (x: number) => number;
