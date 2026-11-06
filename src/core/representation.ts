import { randomInt, randomBytes } from "node:crypto";

/**
 * NaviAccess dynamic representation generator.
 *
 * Generates a randomized representation of an installation keyword.
 */

export interface RepresentationOptions {
  keyword: string;
  randomCharacterCount?: number;
}

export interface GeneratedRepresentation {
  value: string;
  createdAt: string;
}

/**
 * Generate random characters using Node's cryptographic RNG.
 */
function generateRandomCharacters(length: number): string {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from(
    { length },
    () => characters[randomInt(characters.length)],
  ).join("");
}

/**
 * Shuffle characters using cryptographically secure random selection.
 */
function shuffleCharacters(value: string): string {
  const characters = Array.from(value);

  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);

    [characters[i], characters[j]] = [characters[j]!, characters[i]!];
  }

  return characters.join("");
}

/**
 * Generate a unique randomized representation.
 */
export function generateRepresentation(
  options: RepresentationOptions,
): GeneratedRepresentation {
  const { keyword, randomCharacterCount = 12 } = options;

  if (!keyword || keyword.trim().length === 0) {
    throw new Error("NaviAccess keyword cannot be empty.");
  }

  if (
    !Number.isInteger(randomCharacterCount) ||
    randomCharacterCount < 0 ||
    randomCharacterCount > 256
  ) {
    throw new Error("Invalid random character count.");
  }

  const shuffledKeyword = shuffleCharacters(keyword);

  const randomCharacters = generateRandomCharacters(randomCharacterCount);

  const combined = shuffledKeyword + randomCharacters;

  const representation = shuffleCharacters(combined);

  return {
    value: representation,
    createdAt: new Date().toISOString(),
  };
}
