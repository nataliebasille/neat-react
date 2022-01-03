import { Species } from "./types";
import { Genome } from "../genome";

export function createSpecies(
  prototype: Genome,
  additionalMembers: Genome[] = []
): Species {
  return {
    prototype,
    members: [prototype, ...additionalMembers],
  };
}
