/**
 * Type definitions for Bun runtime APIs
 * @see https://bun.sh/docs/api/testing
 */

declare module 'bun:test' {
  /**
   * The describe function creates a block that groups related tests together
   */
  export function describe(name: string, fn: () => void): void;

  /**
   * The it function (alias of test) defines a test case
   */
  export function it(name: string, fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The test function defines a test case
   */
  export function test(name: string, fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The beforeAll function runs a function once before all the tests in a describe block
   */
  export function beforeAll(fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The afterAll function runs a function once after all the tests in a describe block
   */
  export function afterAll(fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The beforeEach function runs a function before each test in a describe block
   */
  export function beforeEach(fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The afterEach function runs a function after each test in a describe block
   */
  export function afterEach(fn: (() => void) | (() => Promise<void>)): void;

  /**
   * The expect function is used to create assertions
   */
  export function expect<T>(actual: T): Matchers<T>;

  /**
   * Jest-like namespace for mock functions and utilities
   */
  export const jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<T>;
    spyOn: <T extends object, K extends keyof T>(object: T, method: K) => jest.Mock<T[K]>;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };

  /**
   * Spy on a method of an object
   */
  export function spyOn<T extends object, K extends keyof T>(object: T, method: K): jest.Mock<T[K]>;

  namespace jest {
    interface Mock<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>;
      mockReturnValue(value: ReturnType<T>): this;
      mockResolvedValue<U extends ReturnType<T>>(value: U extends Promise<infer V> ? V : never): this;
      mockRejectedValue(value: any): this;
      mockImplementation(fn: T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      mock: {
        calls: Parameters<T>[];
        results: { type: 'return' | 'throw'; value: any }[];
        instances: any[];
      };
    }
  }

  interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: any): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toContain(expected: any): void;
    toHaveLength(expected: number): void;
    toHaveProperty(property: string, value?: any): void;
    toMatch(pattern: RegExp | string): void;
    toMatchObject(object: object): void;
    toThrow(error?: any): void;
    toBeInstanceOf(expected: any): void;
    // Jest-like matchers
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenCalledTimes(times: number): void;
    toHaveBeenLastCalledWith(...args: any[]): void;
    not: Matchers<T>;
    resolves: Matchers<Promise<T>>;
    rejects: Matchers<Promise<T>>;
  }

  interface ExpectStatic {
    <T>(actual: T): Matchers<T>;
    // Jest-like static methods
    any(constructor: any): any;
    anything(): any;
    arrayContaining(array: any[]): any;
    objectContaining(object: Record<string, any>): any;
    stringContaining(string: string): any;
    stringMatching(regexp: RegExp | string): any;
  }

  /**
   * Skips a test
   */
  export function skip(name: string, fn: (() => void) | (() => Promise<void>)): void;

  /**
   * Marks a test as todo
   */
  export function todo(name: string, fn?: (() => void) | (() => Promise<void>)): void;
}
