import { test, expect } from '@playwright/test';
import path from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.setContent('<form><label for="phone">Phone</label><div class="phone-field"><input id="phone" type="tel" name="phone"></div><button type="reset">Reset</button></form>');
  await page.addScriptTag({ path: path.resolve('dist/phone-mask.js') });
  await page.evaluate(() => {
    window.input = document.querySelector('input');
    window.changes = [];
    window.mask = PhoneMask.attach(input, { onChange: (value) => changes.push(value) });
  });
});

async function setSelection(page, value, start, end = start) {
  await page.evaluate(({ value, start, end }) => {
    mask.setValue(value);
    input.focus();
    input.setSelectionRange(start, end);
  }, { value, start, end });
}

test('typing and replacing a selected range preserves digit order', async ({ page }) => {
  const input = page.locator('input');
  await input.pressSequentially('+380501234567');
  await expect(input).toHaveValue('+380 50 123 4567');
  await setSelection(page, '+380501234567', 5, 7);
  await input.pressSequentially('67');
  await expect(input).toHaveValue('+380 67 123 4567');
  expect(await input.evaluate((el) => el.selectionStart)).toBe(7);
});
test('Backspace deletes a selection instead of the preceding digit', async ({ page }) => {
  await setSelection(page, '+380501234567', 5, 7);
  await page.locator('input').press('Backspace');
  expect(await page.locator('input').inputValue()).toBe('+380 1234567');
});
test('Backspace across a separator keeps the caret beside the edit', async ({ page }) => {
  await setSelection(page, '+12135550123', 7);
  await page.locator('input').press('Backspace');
  const result = await page.evaluate(() => ({ digits: input.value.replace(/\D/g, ''), caret: input.selectionStart, changes: changes.length }));
  expect(result.digits).toBe('1215550123');
  expect(result.caret).toBeLessThan(7);
  expect(result.changes).toBe(1);
});
test('Delete skips a separator and removes the next digit', async ({ page }) => {
  await setSelection(page, '+12135550123', 6);
  await page.locator('input').press('Delete');
  expect(await page.locator('input').evaluate((el) => el.value.replace(/\D/g, ''))).toBe('1213550123');
});
test('mobile beforeinput works without keydown', async ({ page }) => {
  await setSelection(page, '+12135550123', 7);
  await page.evaluate(() => input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true })));
  expect(await page.locator('input').evaluate((el) => el.value.replace(/\D/g, ''))).toBe('1215550123');
});
test('full selection can be cleared and typing continues immediately', async ({ page }) => {
  await setSelection(page, '+380501234567', 0);
  await page.evaluate(() => input.select());
  await page.locator('input').press('Backspace');
  await expect(page.locator('input')).toHaveValue('');
  await page.locator('input').pressSequentially('48512345678');
  await expect(page.locator('input')).toHaveValue('+48 512 345 678');
});
test('paste/autofill input normalizes full values', async ({ page }) => {
  await page.locator('input').fill('00380 (50) 123-45-67');
  await expect(page.locator('input')).toHaveValue('+380 50 123 4567');
  await expect(page.locator('input')).toHaveAttribute('data-country', 'UA');
  await expect(page.locator('input')).toHaveAttribute('data-phone-possible', 'true');
});
test('typing the 00 international prefix works', async ({ page }) => {
  await page.locator('input').pressSequentially('00380501234567');
  await expect(page.locator('input')).toHaveValue('+380 50 123 4567');
});
test('composition is left untouched until compositionend', async ({ page }) => {
  await page.evaluate(() => {
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = '３８０５０';
    input.dispatchEvent(new InputEvent('input', { isComposing: true, bubbles: true }));
  });
  await expect(page.locator('input')).toHaveValue('３８０５０');
  await page.evaluate(() => input.dispatchEvent(new CompositionEvent('compositionend')));
  await expect(page.locator('input')).toHaveValue('+380 50');
});
test('prefilled values, refresh and reset synchronize metadata', async ({ page }) => {
  await page.evaluate(() => {
    mask.destroy();
    input.defaultValue = '+48512345678';
    mask = PhoneMask.attach(input);
  });
  await expect(page.locator('input')).toHaveValue('+48 512 345 678');
  await page.locator('input').fill('+380501234567');
  await page.locator('button').click();
  await expect(page.locator('input')).toHaveValue('+48 512 345 678');
  await expect(page.locator('input')).toHaveAttribute('data-country', 'PL');
  await page.evaluate(() => { input.value = '+14165550123'; mask.refresh(); });
  await expect(page.locator('input')).toHaveAttribute('data-country', 'CA');
});
test('repeated init is idempotent and destroy restores attributes and events', async ({ page }) => {
  expect(await page.evaluate(() => PhoneMask.init()[0] === mask)).toBe(true);
  await expect(page.locator('.phone-hint')).toHaveCount(1);
  await page.evaluate(() => { mask.destroy(); mask.destroy(); });
  await expect(page.locator('.phone-hint')).toHaveCount(0);
  await expect(page.locator('input')).not.toHaveAttribute('data-country');
  await expect(page.locator('input')).not.toHaveAttribute('inputmode');
  await page.locator('input').fill('123');
  await expect(page.locator('input')).toHaveValue('123');
  await page.evaluate(() => PhoneMask.attach(input));
  await expect(page.locator('input')).toHaveValue('+1 23');
});
test('disabled and read-only fields cannot be changed by deletion handlers', async ({ page }) => {
  await setSelection(page, '+12135550123', 7);
  await page.evaluate(() => {
    input.readOnly = true;
    input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
  });
  await expect(page.locator('input')).toHaveValue('+1 213 555 0123');
});
test('two sibling fields have independent hints; input stays visible without CSS', async ({ page }) => {
  await page.evaluate(() => {
    const other = document.createElement('input');
    other.type = 'tel';
    input.parentElement.append(other);
    PhoneMask.attach(other).setValue('+48512');
    mask.setValue('+38050');
    input.focus();
  });
  await expect(page.locator('.phone-hint')).toHaveCount(2);
  await expect(page.locator('.phone-hint').first()).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('input').first().evaluate((el) => getComputedStyle(el).color)).not.toBe('rgba(0, 0, 0, 0)');
  expect(await page.locator('.hint-remaining').first().textContent()).toContain('_');
});
test('setValue emits only when requested and notifies ordinary form listeners', async ({ page }) => {
  expect(await page.evaluate(() => {
    let events = 0;
    input.form.addEventListener('input', () => events++);
    mask.setValue('+380501234567');
    const silent = events;
    mask.setValue('+48512345678', { emit: true });
    return [silent, events, changes.length, mask.getValue().country];
  })).toEqual([0, 1, 1, 'PL']);
});
test('custom roots support dynamically inserted and shadow DOM fields', async ({ page }) => {
  expect(await page.evaluate(() => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<input type="tel">';
    const [controller] = PhoneMask.init('input', { root, hint: false, defaultCountry: 'UA' });
    return controller.setValue('0501234567').international;
  })).toBe('+380501234567');
});
test('unsupported input types fail before attaching', async ({ page }) => {
  expect(await page.evaluate(() => {
    const number = document.createElement('input');
    number.type = 'number';
    try { PhoneMask.attach(number); } catch (error) { return error.message; }
  })).toContain('type tel, text, or search');
});

test('non-cancelable mobile deletion still removes a digit beside separators', async ({ page }) => {
  await setSelection(page, '+12135550123', 7);
  await page.evaluate(() => {
    input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: false }));
    input.value = input.value.slice(0, 6) + input.value.slice(7);
    input.setSelectionRange(6, 6);
    input.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
  });
  expect(await page.locator('input').evaluate((el) => el.value.replace(/\D/g, ''))).toBe('1215550123');
});

test('national typing, brackets and deletion at the start of an empty field', async ({ page }) => {
  await page.evaluate(() => { mask.destroy(); mask = PhoneMask.attach(input, { defaultCountry: 'US' }); });
  await page.locator('input').press('Backspace');
  await page.locator('input').pressSequentially('2135550123');
  await expect(page.locator('input')).toHaveValue('(213) 555-0123');
  await page.evaluate(() => input.setSelectionRange(6, 6));
  await page.locator('input').press('Backspace');
  expect(await page.locator('input').evaluate((el) => el.value.replace(/\D/g, ''))).toBe('215550123');
});

test('refresh preserves both endpoints of a backward selection', async ({ page }) => {
  expect(await page.evaluate(() => {
    input.value = '+380501234567';
    input.setSelectionRange(4, 6, 'backward');
    mask.refresh();
    return [input.selectionStart, input.selectionEnd, input.selectionDirection];
  })).toEqual([4, 7, 'backward']);
});

test('the minified browser build exposes the same API', async ({ page }) => {
  await page.addScriptTag({ path: path.resolve('dist/phone-mask.min.js') });
  expect(await page.evaluate(() => PhoneMask.parse('+380501234567').country)).toBe('UA');
});
