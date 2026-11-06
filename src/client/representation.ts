export interface ClientRepresentationOptions {
  keyword: string;
  randomCharacterCount?: number;
}

export interface ClientGeneratedRepresentation {
  value: string;
  createdAt: string;
}

const CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRandomCharacters(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => CHARACTERS[byte % CHARACTERS.length]).join(
    "",
  );
}

function shuffleCharacters(value: string): string {
  const characters = Array.from(value);

  const randomValues = new Uint32Array(characters.length);
  crypto.getRandomValues(randomValues);

  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomValues[i]! % (i + 1);

    [characters[i], characters[j]] = [characters[j]!, characters[i]!];
  }

  return characters.join("");
}

export function generateClientRepresentation(
  options: ClientRepresentationOptions,
): ClientGeneratedRepresentation {
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

  const representation = shuffleCharacters(shuffledKeyword + randomCharacters);

  return {
    value: representation,
    createdAt: new Date().toISOString(),
  };
}
