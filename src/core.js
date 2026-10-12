import { AsYouType, getCountries, getExampleNumber, isSupportedCountry } from 'libphonenumber-js/min';
import examples from 'libphonenumber-js/examples.mobile.json';

export { getCountries };

export function normalize(value) {
  return String(value ?? '').replace(/[０-９٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0xff10 ? 0xff10 : code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

export function resolveOptions(options = {}) {
  const country = options.defaultCountry?.toUpperCase();
  if (country && !isSupportedCountry(country)) {
    throw new RangeError(`PhoneMask: unsupported defaultCountry "${country}"`);
  }
  return { ...options, defaultCountry: country || undefined };
}

function clean(value, country) {
  const text = normalize(value).trim().replace(/^tel:/i, '');
  // Extensions belong in a separate field; never append them to the main number.
  const main = text.replace(/(?:;ext=|\bext\.?\s*|x\s*)\d+\s*$/i, '');
  const digits = main.replace(/\D/g, '');
  if (!digits) return main.startsWith('+') ? '+' : '';
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (main.startsWith('+')) return '+' + digits;
  return (country ? '' : '+') + digits;
}

function remainingHint(formatted, country, international) {
  const example = country && getExampleNumber(country, examples);
  if (!example) return '';
  const sample = international ? example.formatInternational() : example.formatNational();
  const prefix = international ? '+' + example.countryCallingCode : '';
  const template = prefix + sample.slice(prefix.length).replace(/\d/g, '_');
  const matches = [...formatted].every((char, index) =>
    template[index] === char || (template[index] === '_' && /\d/.test(char))
  );
  // A mobile example is only a hint, not a rule for every fixed-line number.
  return matches ? template.slice(formatted.length) : '';
}

/** Parse without the DOM. Input is never truncated to a guessed country length. */
export function parse(value, options = {}) {
  const { defaultCountry } = resolveOptions(options);
  const cleaned = clean(value, defaultCountry);
  const formatter = new AsYouType(defaultCountry);
  const formatted = formatter.input(cleaned);
  const number = formatter.getNumber();
  const country = formatter.getCountry();
  const international = number?.number || '';
  const isPossible = Boolean(number && international.length <= 16 && number.isPossible());
  return {
    formatted,
    digits: cleaned.replace(/\D/g, ''),
    international,
    country: country || '',
    countryCallingCode: number?.countryCallingCode || formatter.getCallingCode() || '',
    isPossible,
    maxDigits: 15,
    hint: remainingHint(formatted, country || (!cleaned.startsWith('+') && defaultCountry), cleaned.startsWith('+')),
  };
}

export function format(value, options = {}) {
  return parse(value, options).formatted;
}
