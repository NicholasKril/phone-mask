import type { PhoneOptions, PhoneValue } from './core.js';
export { format, parse, getCountries } from './core.js';
export type { PhoneOptions, PhoneValue } from './core.js';

export interface AttachOptions extends PhoneOptions {
  hint?: boolean;
  root?: ParentNode;
  onChange?: (value: PhoneValue, input: HTMLInputElement) => void;
}
export interface PhoneMaskController {
  readonly input: HTMLInputElement;
  getValue(): PhoneValue;
  setValue(value: string | null | undefined, options?: { emit?: boolean }): PhoneValue;
  refresh(): PhoneValue;
  destroy(): void;
}
export function attach(input: HTMLInputElement, options?: AttachOptions): PhoneMaskController;
export function init(target?: string | HTMLInputElement | Iterable<HTMLInputElement> | ArrayLike<HTMLInputElement>, options?: AttachOptions): PhoneMaskController[];
export function destroy(input: HTMLInputElement): void;
declare const PhoneMask: {
  init: typeof init;
  attach: typeof attach;
  destroy: typeof destroy;
  format: typeof import('./core.js').format;
  parse: typeof import('./core.js').parse;
  getCountries: typeof import('./core.js').getCountries;
};
export default PhoneMask;
