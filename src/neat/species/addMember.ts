import { Species } from "./types";
import { Genome } from "../genome";

export function addMember(species: Species, genome: Genome): Species {
  return {
    ...species,
    members: [...species.members, genome],
  };
}
