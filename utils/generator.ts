import randomNumber from "random-number-csprng";

/**
 * Equivalent to Python's range.
 *
 * [start, end)
 *
 * @param start start number
 * @param end end number (itself isn't contained in the result)
 *
 * @example
 * range(0, 4) // [0, 1, 2, 3]
 */
function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }).map((_, val) => val + start);
}

/**
 * Returns the ASCII code of the given character.
 * @example
 * ord("A") // 65
 *
 * @example
 * ord("a") // 97
 */
function ord(char: string): number {
  return char.charCodeAt(0);
}

/**
 * sequencedChars("AE03wz") = "ABCDE0123wxyz"
 */
export function sequencedChars(chars: string): string {
  /**
   * slicePairs("abcdef") = ["ab", "cd", "ef"]
   */
  function slicePairs(str: string): string[] {
    return range(0, Math.floor(str.length / 2))
      .map((i) => i * 2)
      .map((start) => str.slice(start, start + 2));
  }
  return slicePairs(chars)
    .map(([start, end]) =>
      String.fromCharCode(...range(ord(start), ord(end) + 1))
    )
    .join("");
}

interface Indexable<T> {
  [index: number]: T;
  length: number;
}

/**
 * Calculates [a, a+b, a+b+c, ...] from [a, b, c, ...].
 *
 * @example
 * accumulate([1, 1, 1]) // [1, 2, 3]
 *
 * @example
 * accumulate([3, 2, 1]) // [3, 5, 6]
 */
function accumulate(list: number[]): number[] {
  return list.map(
    (
      (sum) => (value) =>
        (sum += value)
    )(0)
  );
}

async function chooseOneAsync<T>(
  list: Indexable<T>,
  weights?: number[]
): Promise<T> {
  if (list.length === 1) return list[0];
  if (weights && weights.length) {
    const accumulatedWeights = accumulate(weights);
    const n = await randomNumber(
      0,
      accumulatedWeights[accumulatedWeights.length - 1] - 1
    );
    const m = accumulatedWeights.findIndex(
      (sum, i, sums) => (i === 0 ? true : sums[i - 1] <= n) && n < sum
    );
    if (m !== -1) return list[m];
  }
  return list[await randomNumber(0, list.length - 1)];
}

/** Interface of list of alphabets and numbers to be used */
export interface IAlNumTable {
  /**
   * Uppercase characters to be used
   *
   * @example "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
   */
  readonly uppers: string;
  /**
   * Lowercase characters to be used
   *
   * @example "abcdefghijklmnopqrstuvwxyz"
   */
  readonly lowers: string;
  /**
   * Numeric characters to be used
   *
   * @example "0123456789"
   */
  readonly numbers: string;
  /**
   * Set of all characters to be used
   *
   * @example new Set("ABCabc123")
   */
  readonly charSet: Set<string>;
}

/**
 * All alphabets and numbers are enabled
 */
export class FullAlNumTable implements IAlNumTable {
  protected static readonly lowerList: string = sequencedChars("az");
  protected static readonly upperList: string = sequencedChars("AZ");
  protected static readonly digitsList: string = sequencedChars("09");
  static readonly charSet: Set<string> = new Set([
    ...this.lowerList,
    ...this.upperList,
    ...this.digitsList,
  ]);
  get uppers(): string {
    return FullAlNumTable.upperList;
  }

  get lowers(): string {
    return FullAlNumTable.lowerList;
  }

  get numbers(): string {
    return FullAlNumTable.digitsList;
  }
  get charSet(): Set<string> {
    return FullAlNumTable.charSet;
  }
}

/**
 * Based on base58 (Bitcoin & flickr shorthand URL)
 *
 * FYI:
 * - https://ja.wikipedia.org/wiki/Base58 (Japanese)
 * - https://github.com/bitcoin/bitcoin/blob/master/src/base58.h (Bitcoin C++ implementation)
 */
export class Base58AlNumTable implements IAlNumTable {
  protected static readonly lowerList: string = "abcdefghijkmnopqrstuvwxyz";
  protected static readonly upperList: string = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  protected static readonly digitsList: string = "123456789";
  static readonly charSet: Set<string> = new Set([
    ...this.lowerList,
    ...this.upperList,
    ...this.digitsList,
  ]);
  get uppers(): string {
    return Base58AlNumTable.upperList;
  }

  get lowers(): string {
    return Base58AlNumTable.lowerList;
  }

  get numbers(): string {
    return Base58AlNumTable.digitsList;
  }
  get charSet(): Set<string> {
    return Base58AlNumTable.charSet;
  }
}

/**
 * Based on Base56 (Base58 - "1o")
 */
export class Base56AlNumTable implements IAlNumTable {
  protected static readonly lowerList: string = "abcdefghijkmnpqrstuvwxyz";
  protected static readonly upperList: string = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  protected static readonly digitsList: string = "23456789";
  static readonly charSet: Set<string> = new Set([
    ...this.lowerList,
    ...this.upperList,
    ...this.digitsList,
  ]);
  get uppers(): string {
    return Base56AlNumTable.upperList;
  }

  get lowers(): string {
    return Base56AlNumTable.lowerList;
  }

  get numbers(): string {
    return Base56AlNumTable.digitsList;
  }
  get charSet(): Set<string> {
    return Base56AlNumTable.charSet;
  }
}

export type AlNumTableFactoryType = keyof typeof AlNumTableFactory.list;

export class AlNumTableFactory {
  static list = {
    allowAll: () => new FullAlNumTable(),
    base58: () => new Base58AlNumTable(),
    base56: () => new Base56AlNumTable(),
  } as const;

  static get labelsForVList() {
    return Object.keys(AlNumTableFactory.list) as AlNumTableFactoryType[];
  }
}

interface PasswordGeneratorOptions {
  /** Password length */
  passwordLength: number;
  /** `true` if uppercase is used */
  usesUppers: boolean;
  /** `true` if numbers are used */
  usesNumbers: boolean;
  /** `true` if symbols are used */
  usesSymbols: boolean;
  /** weight (frequency) of alphabets */
  weightAlphas: number;
  /** weight (frequency) of numbers */
  weightNumbers: number;
  /** weight (frequency) of symbols */
  weightSymbols: number;
  /** list of symbols to be used */
  usingSymbolsList: string;
  /** alphabets and numbers to be used */
  alNumTable: IAlNumTable;
}

class PasswordGenerator {
  protected readonly option: PasswordGeneratorOptions;
  protected readonly charListsList: string[];
  protected readonly charTypeWeights: number[];

  constructor(option: PasswordGeneratorOptions) {
    this.option = option;
    const usingSymbolsList = this.option.usingSymbolsList;
    this.charListsList = [
      this.option.alNumTable.lowers,
      this.option.alNumTable.uppers,
      this.option.alNumTable.numbers,
      usingSymbolsList,
    ];
    // p(lower) /= 2 and p(upper) /= 2.
    // weights must be integers, so p(num) *= 2 and p(symbol) *= 2 instead.
    const numSymbolWeightCoef = this.option.usesUppers ? 2 : 1;
    this.charTypeWeights = [
      this.option.weightAlphas,
      this.option.usesUppers ? this.option.weightAlphas : 0,
      this.option.usesNumbers
        ? this.option.weightNumbers * numSymbolWeightCoef
        : 0,
      this.option.usesSymbols && usingSymbolsList.length
        ? this.option.weightSymbols * numSymbolWeightCoef
        : 0,
    ];
  }

  /**
   * Generates one password.
   *
   * @returns {Promise<string>} Generated password
   */
  public async generateOne(): Promise<string> {
    return (
      await Promise.all(
        Array(this.option.passwordLength)
          .fill(null)
          .map(async () => {
            const ret = await chooseOneAsync(
              await chooseOneAsync(this.charListsList, this.charTypeWeights)
            );
            return ret;
          })
      )
    ).join("");
  }
}

/**
 * PasswordGenerator class preventing consecutive charactors.
 *
 * Some websites refuse passwords containing consecutive charactors like "aa" "11".
 * Moreover, other ones allows those but refuses, e.g., "bbb" "4444" (more than 3 charactors).
 */
export class DuplicationRestrictedPasswordGenerator extends PasswordGenerator {
  protected readonly allowedMaxConsecutiveCharsCount: number;
  constructor(
    option: PasswordGeneratorOptions,
    allowedMaxConsecutiveCharsCount: number
  ) {
    super(option);
    this.allowedMaxConsecutiveCharsCount = allowedMaxConsecutiveCharsCount;
  }

  public async generateOne(): Promise<string> {
    let password = "";
    let lastGeneratedChar = "";
    let consecutiveCharsCount = 1;
    while (password.length !== this.option.passwordLength) {
      // Brute force duplication exclusion using loop
      // Makeshift implementation
      // Pile of 💩: Must be refactored
      let justGeneratedChar;
      do {
        justGeneratedChar = await chooseOneAsync(
          await chooseOneAsync(this.charListsList, this.charTypeWeights)
        );
      } while (
        consecutiveCharsCount >= this.allowedMaxConsecutiveCharsCount &&
        justGeneratedChar === lastGeneratedChar
      );
      // End of inefficient algorithm
      if (justGeneratedChar === lastGeneratedChar) ++consecutiveCharsCount;

      password += justGeneratedChar;
      lastGeneratedChar = justGeneratedChar;
    }
    return password;
  }
}

export const passwordCharsConsecutionPolicies = [
  "allowAll",
  "rejectAll",
  "limitToLessThan3",
] as const;

export type passwordCharsConsecutionPoliciesType =
  typeof passwordCharsConsecutionPolicies[number];

/**
 * Factory function of *PasswordGenerator.
 *
 * @param {PasswordGeneratorOptions} option Options
 * @param {number} allowedMaxConsecutiveCharsCount 0: no requirements for consecutive charactors / 1: any consecution rejected / 2: rejected ones like "aaa"
 */
export function generatePasswordGeneratorInstance(
  option: PasswordGeneratorOptions,
  allowedMaxConsecutiveCharsCount: number = 0
): PasswordGenerator {
  if (allowedMaxConsecutiveCharsCount <= 0)
    return new PasswordGenerator(option);
  return new DuplicationRestrictedPasswordGenerator(
    option,
    allowedMaxConsecutiveCharsCount
  );
}
