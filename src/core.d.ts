export interface PhoneOptions {
  /** Country/territory code returned by getCountries(), e.g. UA. */
  defaultCountry?: string;
}
export interface PhoneValue {
  formatted: string;
  digits: string;
  /** Normalized international value; may be incomplete. Check isPossible. */
  international: string;
  country: string;
  countryCallingCode: string;
  /** Length check only; not proof that a number exists. */
  isPossible: boolean;
  maxDigits: number;
  hint: string;
}
export function format(value: string | null | undefined, options?: PhoneOptions): string;
export function parse(value: string | null | undefined, options?: PhoneOptions): PhoneValue;
export function getCountries(): string[];
