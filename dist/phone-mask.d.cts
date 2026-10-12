import type { PhoneOptions, PhoneValue } from './core.cjs';
export { format, parse, getCountries } from './core.cjs';
export type { PhoneOptions, PhoneValue } from './core.cjs';

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
  format: typeof import('./core.cjs').format;
  parse: typeof import('./core.cjs').parse;
  getCountries: typeof import('./core.cjs').getCountries;
};
export default PhoneMask;
