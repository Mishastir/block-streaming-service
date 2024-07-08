import * as fs from "fs";

/* eslint-disable class-methods-use-this */

export abstract class AbstractConfig {
  protected getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain valid number. Got undefined`);
    }

    if (value === "") {
      throw new TypeError(`Config key "${key}" MUST contain valid number. Got ""`);
    }

    const num = Number(value);

    if (Number.isFinite(num)) {
      return num;
    }

    throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
  }

  protected getString(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
    }

    return value;
  }

  protected getStringArray(key: string, separator: string, defaultValue?: string[]): string[] {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
    }

    return value.split(separator);
  }

  protected getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got undefined`);
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got "${value}"`);
  }

  protected getFile(key: string): string {
    const value = process.env[key];

    if (value === undefined) {
      throw new TypeError(`Config key "${key}" MUST contain path to file. Got undefined`);
    }

    if (value === "") {
      throw new TypeError(`Config key "${key}" MUST contain path to file. Got ""`);
    }

    try {
      return fs.readFileSync(value, { encoding: "utf8" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw new TypeError(`File reading of config key "${key}" with value ${value} fails with error: ${err?.message}`);
    }
  }
}
