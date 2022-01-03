import { useCallback, useState } from "react";
import { range } from "../utilities";
import { createGenone, Genome } from "./genome";

type UseNeatProps = {
  initialPopulationSize: number;
  rng?: () => number;
};

export const useNeat = ({
  initialPopulationSize,
  rng = () => Math.random(),
}: UseNeatProps) => {
  const [population, setPopulation] = useState<Genome[]>(
    range(initialPopulationSize).map(createGenone)
  );

  const nextGeneration = useCallback(() => {}, []);

  return null;
};
