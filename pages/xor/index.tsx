import { NextPage } from "next";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  createGenone,
  createPopulation,
  Genome,
  mutate,
  nextGeneration,
  Population,
} from "../../src/neat";
import { evaluate } from "../../src/neat/genome/evaluate";
import { delay } from "../../src/promises/delay";
import { range } from "../../src/utilities";
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

// type Population = {
//   genome: Genome;
//   outputs: number[] | undefined;
//   fitness: number | undefined;
// };

const XorPage: NextPage = () => {
  const [population, setPopulation] = useState<Population>(() =>
    createPopulation({
      rng,
      nextInnovationNumber,
      inputs: 2,
      outputs: 1,
      weightPerturbationChance: 0.9,
      weightMutationChance: 0.8,
    })
  );

  const populationEvaluation = useMemo(() => {
    return population.species.map((species) => {
      return species.members.map((genome) => {
        const [outputs, fitness] = evaluateGenome(genome);
        return { genome, outputs, fitness };
      });
    });
  }, [population]);

  const champion = useMemo(() => {
    return populationEvaluation.reduce(
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

  useEffect(() => {
    const execute = async () => {
      await delay(50);
      setPopulation(
        nextGeneration(population, {
          rng,
          nextInnovationNumber,
          fitness: (genome) => evaluateGenome(genome)[1],
          fitnessProportion: 0.2,
        })
      );
    };

    execute();
  }, [population]);

  return (
    <>
      <h3>Generation: {population.generation}</h3>

      {champion && (
        <>
          <h4>Champion</h4>

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

      {populationEvaluation.map((species, index) => (
        <Fragment key={index}>
          <h4>Species {index + 1}</h4>

          <table className={(styles as any).table}>
            <thead>
              <th>Id</th>
              <th>Genome</th>
              <th>0 xor 0</th>
              <th>0 xor 1</th>
              <th>1 xor 0</th>
              <th>1 xor 1</th>
              <th>Fitness</th>
            </thead>

            {species.map(({ genome, outputs, fitness }, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div>
                    Hidden Nodes:{" "}
                    {genome.nodes.filter((x) => x.type === "hidden").length}
                  </div>
                  <div>Genes: {genome.genes.length}</div>
                </td>

                {outputs.map((output, index) => (
                  <td key={index}>{output}</td>
                ))}

                <td>{fitness}</td>
              </tr>
            ))}
          </table>
        </Fragment>
      ))}
    </>
  );
};

export default XorPage;
