export interface ValidationOptions {
  representation: string;
  keyword: string;
  randomCharacterCount?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason: string;
}

/**
 * Validate a randomized NaviAccess representation.
 *
 * Checks:
 * - Keyword characters are present.
 * - Character frequencies match.
 * - Random character count is valid.
 */
export function validateRepresentation(
  options: ValidationOptions,
): ValidationResult {
  const { representation, keyword, randomCharacterCount = 12 } = options;

  if (!representation || !keyword) {
    return {
      valid: false,
      reason: "Missing representation or keyword.",
    };
  }

  if (
    !Number.isInteger(randomCharacterCount) ||
    randomCharacterCount < 0 ||
    randomCharacterCount > 256
  ) {
    return {
      valid: false,
      reason: "Invalid random character count.",
    };
  }

  if (representation.length !== keyword.length + randomCharacterCount) {
    return {
      valid: false,
      reason: "Invalid representation length.",
    };
  }

  const expectedCharacters = new Map<string, number>();

  for (const character of keyword) {
    expectedCharacters.set(
      character,
      (expectedCharacters.get(character) ?? 0) + 1,
    );
  }

  const submittedCharacters = new Map<string, number>();

  for (const character of representation) {
    submittedCharacters.set(
      character,
      (submittedCharacters.get(character) ?? 0) + 1,
    );
  }

  for (const [character, count] of expectedCharacters) {
    if ((submittedCharacters.get(character) ?? 0) < count) {
      return {
        valid: false,
        reason: "Master keyword characters are incomplete.",
      };
    }
  }

  return {
    valid: true,
    reason: "Representation structure is valid.",
  };
}
