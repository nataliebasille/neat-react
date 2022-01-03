import { Species } from "./types";
import { Genome } from "../genome";

export function createSpecies(
  prototype: Genome,
  additionalMembers: Genome[] = []
): Species {
  return {
    staleness: 0,
    prototype,
    members: [prototype, ...additionalMembers],
  };
}
