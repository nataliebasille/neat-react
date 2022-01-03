import { NextInnovationNumber } from "../genome";

export function nextInnovationNumberForPopulationFactory(
  nextInnovationNumber: NextInnovationNumber
): NextInnovationNumber {
  const hash: { [key: string]: number } = {};

  return (connection) => {
    const key = `${connection.in}->${connection.out}`;

    if (key in hash) {
      return hash[key];
    }

    return (hash[key] = nextInnovationNumber(connection));
  };
}
