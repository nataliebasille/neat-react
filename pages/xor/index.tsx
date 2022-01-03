import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPopulation,
  Genome,
  nextGeneration,
  Population,
} from "../../src/neat";
import { evaluate } from "../../src/neat/genome/evaluate";
import * as styles from "./index.module.css";

let uuid = 0;
const nextInnovationNumber = () => ++uuid;
const rng = () => Math.random();

const inputs = [
  {
    input: [0, 0],
    expected: 0,
  },
  {
    input: [0, 1],
    expected: 1,
  },
  {
    input: [1, 0],
    expected: 1,
  },
  {
    input: [1, 1],
    expected: 0,
  },
];

const evaluateGenome = (genome: Genome) => {
  const outputs = inputs.map((input) => evaluate(genome, input.input)[0]);
  const fitness =
    4 -
    outputs.reduce(
      (acc, actual, index) => acc + Math.abs(actual - inputs[index].expected),
      0
    );
  return [outputs, fitness] as const;
};

const XorPage: NextPage = () => {
  const [population, setPopulation] = useState<Population | null>(null);

  const populationEvaluation = useMemo(() => {
    return population?.species
      .map((species) => {
        return species.members
          .map((genome) => {
            const [outputs, fitness] = evaluateGenome(genome);
            return { genome, outputs, fitness };
          })
          .sort((a, b) => b.fitness - a.fitness);
      })
      .sort((a, b) => b[0].fitness - a[0].fitness);
  }, [population]);

  const champion = useMemo(() => {
    return populationEvaluation?.reduce(
      (currentChampion: typeof populationEvaluation[0][0] | null, species) => {
        const champion = species.reduce((currentChampion, member) => {
          return !currentChampion || member.fitness > currentChampion.fitness
            ? member
            : currentChampion;
        }, currentChampion);

        return champion;
      },
      null
    );
  }, [populationEvaluation]);

  const start = useCallback(() => {
    setPopulation(
      createPopulation({
        rng,
        nextInnovationNumber,
        populationSize: 200,
        speciesDistanceThreshold: 3,
        inputs: 2,
        outputs: 1,
        weightPerturbationChance: 0.9,
        weightMutationChance: 0.8,
      })
    );
  }, []);

  const [allChampions, setAllChampions] = useState<
    Exclude<typeof champion & { numberOfGenerations: number }, null>[]
  >([]);

  const summary = useMemo(() => {
    return allChampions.length
      ? {
          numberOfRounds: allChampions.length,
          averageHiddenNodes:
            allChampions.reduce(
              (acc, champion) =>
                acc +
                champion.genome.nodes.filter((x) => x.type === "hidden").length,
              0
            ) / allChampions.length,
          averageGenes:
            allChampions.reduce(
              (acc, champion) => acc + champion.genome.genes.length,
              0
            ) / allChampions.length,
          averageDisabledGenes:
            allChampions.reduce(
              (acc, champion) =>
                acc + champion.genome.genes.filter((x) => !x.enabled).length,
              0
            ) / allChampions.length,
          averageNumberOfGenerations:
            allChampions.reduce(
              (acc, champion) => acc + champion.numberOfGenerations,
              0
            ) / allChampions.length,
        }
      : null;
  }, [allChampions]);

  useEffect(() => {
    const execute = () => {
      if (population) {
        setPopulation(
          nextGeneration(population, {
            rng,
            nextInnovationNumber,
            fitness: (genome) => evaluateGenome(genome)[1],
            fitnessProportion: 0.2,
          })
        );
      }
    };

    if (
      champion &&
      champion.outputs.reduce((acc, out, index) => {
        return acc + Math.abs(out - inputs[index].expected);
      }) < 0.001
    ) {
      setAllChampions((c) => [
        ...c,
        { ...champion, numberOfGenerations: population!.generation },
      ]);
      start();
    } else {
      execute();
    }
  }, [champion, population]);

  useEffect(() => {
    start();
  }, []);

  return (
    <>
      {summary && (
        <>
          <h3>Summary</h3>

          <table className={(styles as any).table}>
            <thead>
              <tr>
                <th># of completed rounds</th>
                <th>average # of generations</th>
                <th>average hidden nodes</th>
                <th>average genes</th>
                <th>average disabled genes</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{summary.numberOfRounds}</td>
                <td>{summary.averageNumberOfGenerations}</td>
                <td>{summary.averageHiddenNodes}</td>
                <td>{summary.averageGenes}</td>
                <td>{summary.averageDisabledGenes}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h3>Generation: {population?.generation}</h3>

      {champion && (
        <>
          <h4>Current Champion</h4>

          <table className={(styles as any).table}>
            <thead>
              <th>Genome</th>
              <th>0 xor 0</th>
              <th>0 xor 1</th>
              <th>1 xor 0</th>
              <th>1 xor 1</th>
              <th>Fitness</th>
            </thead>

            <tr>
              <td>
                <div>
                  Hidden Nodes:{" "}
                  {
                    champion.genome.nodes.filter((x) => x.type === "hidden")
                      .length
                  }
                </div>
                <div>Genes: {champion.genome.genes.length}</div>
              </td>

              {champion.outputs.map((output, index) => (
                <td key={index}>{output}</td>
              ))}

              <td>{champion.fitness}</td>
            </tr>
          </table>
        </>
      )}

      <h3>Past Champions</h3>

      <table className={(styles as any).table}>
        <thead>
          <tr>
            <th>Genome</th>
            <th>Fitness</th>
          </tr>
        </thead>

        {allChampions.map((champion, index) => (
          <tr key={index}>
            <td>
              <div>
                Hidden Nodes:{" "}
                {
                  champion.genome.nodes.filter((x) => x.type === "hidden")
                    .length
                }
              </div>
              <div>Genes: {champion.genome.genes.length}</div>
            </td>
            <td>{champion.fitness}</td>
          </tr>
        ))}
      </table>
    </>
  );
};

export default XorPage;
