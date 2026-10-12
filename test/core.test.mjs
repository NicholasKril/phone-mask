import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { getExampleNumber } from 'libphonenumber-js/min';
import PhoneMask, { format, parse, init, getCountries } from 'phonemask';
import * as core from 'phonemask/core';

test('ESM and CommonJS imports work without window/document', () => {
  const require = createRequire(import.meta.url);
  assert.equal(require('phonemask').format('+380501234567'), format('+380501234567'));
  assert.equal(require('phonemask/core').format('+380501234567'), core.format('+380501234567'));
  assert.equal(PhoneMask.parse, parse);
  assert.deepEqual(init(), []);
});

for (const [country, value] of [
  ['UA', '+380501234567'], ['PL', '+48512345678'], ['US', '+12135550123'],
  ['CA', '+14165550123'], ['GB', '+442079460018'], ['BR', '+5511987654321'],
  ['TR', '+905321234567'], ['JP', '+819012345678'], ['IN', '+919876543210'],
  ['AU', '+61412345678'], ['DE', '+4915123456789'], ['PT', '+351912345678'],
]) {
  test(`preserves complete ${country} numbers and detects country`, () => {
    const result = parse(value);
    assert.equal(result.formatted.replace(/\D/g, ''), value.slice(1));
    assert.equal(result.international, value);
    assert.equal(result.country, country);
    assert.equal(result.isPossible, true);
    assert.equal(format(result.formatted), result.formatted);
  });
}

test('national formatting requires an explicit country', () => {
  assert.equal(parse('0501234567', { defaultCountry: 'ua' }).international, '+380501234567');
  assert.equal(parse('02079460018', { defaultCountry: 'GB' }).international, '+442079460018');
  assert.equal(parse('2135550123', { defaultCountry: 'US' }).international, '+12135550123');
  assert.equal(format('0501234567'), '+0501234567');
});
test('international input overrides the default country', () => {
  assert.equal(parse('+48512345678', { defaultCountry: 'UA' }).country, 'PL');
});
test('empty, partial and unknown numbers are safe', () => {
  for (const value of ['', null, undefined, 'abc']) assert.equal(format(value), '');
  assert.equal(format('+'), '+');
  assert.equal(parse('+1').country, '');
  assert.equal(parse('+99912345').isPossible, false);
  assert.equal(parse('+99912345').international, '');
});
test('input is never silently truncated', () => {
  const digits = '380501234567890123456';
  assert.equal(parse('+' + digits).digits, digits);
  assert.equal(format('+' + digits).replace(/\D/g, ''), digits);
  assert.equal(parse('+' + digits).isPossible, false);
});
test('paste normalization supports 00, Unicode digits and telephone links', () => {
  const expected = format('+380501234567');
  for (const value of ['00380 (50) 123-45-67', '+３８０５０１２３４５６７', '+٣٨٠٥٠١٢٣٤٥٦٧', '+۳۸۰۵۰۱۲۳۴۵۶۷', 'tel:+380501234567;ext=123']) {
    assert.equal(format(value), expected);
  }
});
test('options reject unknown countries', () => {
  assert.throws(() => format('123', { defaultCountry: 'ZZ' }), RangeError);
});
test('country coverage is provided by metadata, hints are optional templates', () => {
  assert.ok(getCountries().length > 200);
  assert.match(parse('+38050').hint, /_/);
  assert.equal(parse('+999').hint, '');
});

test('every bundled mobile example retains its full international digits', () => {
  const require = createRequire(import.meta.url);
  const examples = JSON.parse(readFileSync(require.resolve('libphonenumber-js/examples.mobile.json'), 'utf8'));
  for (const country of getCountries()) {
    const example = getExampleNumber(country, examples);
    if (!example) continue;
    const result = parse(example.number);
    assert.equal(result.formatted.replace(/\D/g, ''), example.number.slice(1), country);
    assert.equal(result.international, example.number, country);
    assert.equal(result.isPossible, true, country);
  }
});
