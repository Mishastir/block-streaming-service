import * as fs from "fs";

import { OnModuleInit } from "@nestjs/common";

/* eslint-disable class-methods-use-this */

interface ErrorFormat {
  key: string;
  value: string | undefined | null;
  type: string;
}

const magenta = (str: string): string => `\x1b[35m${str}\x1b[0m`;
// const yellow = (str: string): string => `\x1b[33m${str}\x1b[0m`;
const blue = (str: string): string => `\x1b[34m${str}\x1b[0m`;
const cyan = (str: string): string => `\x1b[36m${str}\x1b[0m`;
const red = (str: string): string => `\x1b[31m${str}\x1b[0m`;


export abstract class AbstractConfigV2 implements OnModuleInit {
  protected errors: ErrorFormat[] = [];

  onModuleInit(): void {
    const isProduction = process.env.NODE_ENV === "production";

    if (this.errors.length) {
      let errorMessage = "Failed to load config";

      if (isProduction) {
        errorMessage += ". ";
        errorMessage += this.errors
          .map((el) => (
            `Config key ${el.key} MUST contain ${el.type} got ${el.value}`
          ))
          .join("; ");
      } else {
        errorMessage = red(`${errorMessage}\n`);
        errorMessage += this.errors
          .map((el) => (
            `Config key ${blue(el.key)} MUST contain ${cyan(el.type)} got ${magenta(el.value)}`
          ))
          .join("\n");
      }

      throw new TypeError(errorMessage);
    }
  }

  protected getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      this.errors.push({ key, value: undefined, type: "number" });
      return null;
    }

    if (value === "") {
      this.errors.push({ key, value: "", type: "number" });
      return null;
    }

    const num = Number(value);

    if (Number.isFinite(num)) {
      return num;
    }

    this.errors.push({ key, value, type: "number" });
    return null;
  }

  protected getString(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      this.errors.push({ key, value: undefined, type: "string" });
      return null;
    }

    return value;
  }

  protected getStringArray(key: string, separator: string, defaultValue?: string[]): string[] {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      this.errors.push({ key, value: undefined, type: "string" });
      return null;
    }

    return value.split(separator);
  }

  protected getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      this.errors.push({ key, value: undefined, type: "boolean (true, false)" });
      return null;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    this.errors.push({ key, value, type: "boolean (true, false)" });
    return null;
  }

  protected getFile(key: string): string {
    const value = process.env[key];

    if (value === undefined) {
      this.errors.push({ key, value: undefined, type: "path to file" });
      return null;
    }

    if (value === "") {
      this.errors.push({ key, value: "", type: "path to file" });
      return null;
    }

    try {
      return fs.readFileSync(value, { encoding: "utf8" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw new TypeError(`File reading of config key "${key}" with value ${value} fails with error: ${err?.message}`);
    }
  }
}
