import { Genome } from "../genome";

export type Species = {
  readonly prototype: Genome;
  readonly members: Genome[];
};
