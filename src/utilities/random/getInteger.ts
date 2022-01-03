import { RandomNumberGenerator } from "./types";

export function getInteger(
  rng: RandomNumberGenerator,
  min: number,
  max: number
): number {
  return Math.floor(rng() * (max - min)) + min;
}
