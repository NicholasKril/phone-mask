# PhoneMask 2

A JavaScript phone number formatter for websites, CMS platforms, React, Vue, Next.js, and server-side JavaScript. The browser bundle is self-contained: no additional scripts or network requests are needed while the user types.

Version 2 builds on [PhoneMask 1.0.0](https://github.com/NicholasKril/phone-mask/tree/143410c), fixing input editing, replacing the manual country table, and adding module support. This is a **major update**. Read “Migrating from v1” before replacing an existing installation.

## Features

- Formatting while typing, pasting, and autofilling through `input` / `change` events.
- Editing in the middle of a number, text selections, and Backspace/Delete around separators.
- `beforeinput` and IME/composition support without relying on a physical keyboard.
- International numbers starting with `+` or `00`, and national numbers with an explicit default country.
- Normalization of full-width, Arabic-Indic, and Persian digits.
- Metadata for more than 200 countries and territories, without truncating numbers to an incorrectly guessed length.
- A separate hint that keeps the actual input text visible and is hidden from screen readers.
- Idempotent initialization, cleanup with `destroy()`, and support for dynamic forms.
- A browser global, ESM, CommonJS, TypeScript declarations, and a separate DOM-free module.

International formats and examples come from [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js). The library and its minimal metadata are bundled in `dist`. This is **not a zero-dependency implementation**, although the built files require no separately installed dependencies. The current `phone-mask.min.js` is approximately 151 kB, or 37 kB with gzip. The full country coverage increases the bundle size compared with v1.

## Quick start: HTML

Copy `phone-mask.min.js`, `phone-mask.css`, and `THIRD_PARTY_NOTICES.txt` from `dist/` to your site's assets directory. The CSS is only needed for the hint overlay.

```html
<link rel="stylesheet" href="/assets/phone-mask.css">

<label for="phone">Phone number</label>
<div class="phone-field">
  <input id="phone" name="phone" type="tel" autocomplete="tel"
         aria-describedby="phone-help">
</div>
<p id="phone-help">Enter a number with its country calling code, such as +380.</p>

<!-- Load after the form markup, before the closing body tag. -->
<script src="/assets/phone-mask.min.js"></script>
<script>
  const masks = PhoneMask.init();
</script>
```

By default, `PhoneMask.init()` attaches to every `input[type="tel"]` present when it is called. Initialization is explicit. To load scripts in `<head>`, use `defer` on both the library script and a separate initialization script, in that order.

If your CMS or design system controls the field's appearance, disable the hint. No additional CSS is needed:

```js
PhoneMask.init('input[type="tel"]', { hint: false });
```

For Ukrainian numbers entered in national format:

```js
PhoneMask.init('.phone-input', { defaultCountry: 'UA', hint: false });
// 0501234567 → 050 123 4567
// +48512345678 → +48 512 345 678
```

Without `defaultCountry`, digits are interpreted as an international number: `380501234567` → `+380 50 123 4567`. A leading `0` alone does not identify a country. With `defaultCountry`, a number without `+` is treated as national; use `+` when supplying an international number.

## Installation in a JavaScript project

Install from the downloaded v2 package:

```sh
npm install ./phonemask-2.0.0.tgz
```

Or build a package from a local copy of this repository:

```sh
npm ci
npm pack
# From your application's directory:
npm install /path/to/phone-mask/phonemask-2.0.0.tgz
```

This README does not assume that v2 has been published to npm. Running `npm install phonemask` may install a different or older package. Use this version's package archive.

```js
// ESM / Vite / webpack / Rollup
import PhoneMask, { attach, format, parse } from 'phonemask';
import 'phonemask/style.css'; // Optional; only needed for the hint.

const controller = attach(document.querySelector('#phone'), {
  defaultCountry: 'UA',
  hint: false,
});
```

```js
// CommonJS / Node.js
const PhoneMask = require('phonemask');
console.log(PhoneMask.format('+380501234567'));
```

For native browser ESM, import `./dist/phone-mask.mjs` from an HTTP(S) server. All dependencies are included. Files in `src/` are development sources and require a build.

## API

### Attaching a mask

```js
const [mask] = PhoneMask.init('#phone', { defaultCountry: 'UA' });
const sameMask = PhoneMask.attach(document.querySelector('#phone'));
```

`init(target?, options?)` returns an array of controllers. `target` can be a CSS selector, a single input, a NodeList, or an array of inputs. Supported input types are `tel`, `text`, and `search`. The `number` type is unsupported because it does not provide the required selection APIs.

| Option | Type / default | Purpose |
| --- | --- | --- |
| `defaultCountry` | string / unset | A code returned by `PhoneMask.getCountries()`, such as `UA`, `PL`, or `US`. Case-insensitive. |
| `hint` | boolean / `true` | Whether to create a visual hint. |
| `root` | Document, Element, ShadowRoot / document | Where `init` searches for the selector. |
| `onChange` | `(value, input) => void` | Receives the current result after input, `change`, and form reset. |

Calling `attach` / `init` again returns the existing controller and **does not change its options**. To change the default country or hint setting, call `destroy()` and attach a new mask.

### Controller

```js
mask.setValue('+380501234567');                // No events.
mask.setValue('+48512345678', { emit: true }); // An input event and mask notifications.
const value = mask.getValue();
mask.refresh();                              // After assigning input.value directly.
mask.destroy();                              // Remove listeners, the hint, and mask attributes.
PhoneMask.destroy(document.querySelector('#phone')); // Equivalent cleanup.
```

`destroy()` keeps the formatted value, restores previous values of the managed attributes, and is safe to call repeatedly. Create a new controller to attach the mask again. Assigning `input.value` does not generate browser events; use `setValue` or `refresh` to synchronize the mask.

### Formatting without an input

```js
import { format, parse, getCountries } from 'phonemask/core';

format('+380501234567');
// '+380 50 123 4567'

parse('0501234567', { defaultCountry: 'UA' });
// {
//   formatted: '050 123 4567',
//   digits: '0501234567',
//   international: '+380501234567',
//   country: 'UA',
//   countryCallingCode: '380',
//   isPossible: true,
//   maxDigits: 15,
//   hint: ''
// }
```

`format()` returns a string. `parse()` and the controller's value methods return the result shown above. `international` may be empty or incomplete while typing. `isPossible` checks **possible length**, not whether the number exists, who owns it, or whether it is reachable. It does not strictly validate every numbering range.

An overly long number stays in the field with `isPossible: false`, allowing the user to correct it without silently losing digits. `maxDigits: 15` is an international-number guideline, not an enforced input limit. `country` is empty when the country is still ambiguous or the calling code is non-geographic. For example, `+1` does not automatically mean Canada or the United States.

### Events and form submission

```js
const input = document.querySelector('#phone');
const hidden = document.querySelector('#phone-international');
const [mask] = PhoneMask.init('#phone', {
  hint: false,
  onChange(value) {
    hidden.value = value.isPossible ? value.international : '';
  },
});
hidden.value = mask.getValue().isPossible ? mask.getValue().international : '';

input.addEventListener('phonemask:change', (event) => {
  console.log(event.detail.country);
});
```

Add `<input type="hidden" id="phone-international" name="phone_international">` if your server needs the international number without spaces. The `name="phone"` field itself submits the **formatted** text. PhoneMask does not intercept form submission or replace server-side validation. The `phonemask:change` event bubbles, crosses Shadow DOM boundaries, and provides the result in `event.detail`.

Managed data attributes are `data-country`, `data-length="15"`, and `data-phone-possible="true|false"`. Use the callback or event for integrations instead of polling with `setInterval`.

## React and Next.js

Attach the DOM mask to an **uncontrolled** input inside an effect. Do not combine it with `value={state}` or a second mask on the same field. See the [React input documentation](https://react.dev/reference/react-dom/components/input) for details about controlled and uncontrolled inputs.

```jsx
'use client'; // Required in the Next.js App Router.

import { useEffect, useRef, useState } from 'react';
import PhoneMask from 'phonemask';

export default function PhoneField() {
  const inputRef = useRef(null);
  const [international, setInternational] = useState('');

  useEffect(() => {
    const mask = PhoneMask.attach(inputRef.current, {
      defaultCountry: 'UA',
      hint: false,
      onChange: (value) => setInternational(value.international),
    });
    setInternational(mask.getValue().international);
    return () => mask.destroy(); // Also handles Strict Mode cleanup.
  }, []);

  return (
    <label>
      Phone number
      <input ref={inputRef} type="tel" name="phone" autoComplete="tel" />
      <input type="hidden" name="phone_international" value={international} />
    </label>
  );
}
```

Importing the module is safe during SSR: it does not access `window` or `document` at load time. Calling `init()` with a selector when no DOM is available returns `[]`. Attach to actual inputs on the client. For a fully controlled component, use `phonemask/core` and manage selection within your component.

## Vue 3 / Nuxt

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import PhoneMask from 'phonemask';

const input = ref(null);
const international = ref('');
let mask;
onMounted(() => {
  mask = PhoneMask.attach(input.value, {
    defaultCountry: 'UA',
    hint: false,
    onChange: (value) => { international.value = value.international; },
  });
  international.value = mask.getValue().international;
});
onBeforeUnmount(() => mask?.destroy());
</script>

<template>
  <label>
    Phone number
    <input ref="input" type="tel" name="phone" autocomplete="tel">
    <input type="hidden" name="phone_international" :value="international">
  </label>
</template>
```

Do not add `v-model` to an input managed by the DOM mask. Use `mask.setValue(...)` for external value updates. In Nuxt, this example attaches only in `onMounted`, keeping DOM access out of server-side rendering.

## WordPress

Copy `phone-mask.min.js` and the license notices file to your **child theme's** `assets/` directory. Add the following to its `functions.php`, using the standard [wp_enqueue_script](https://developer.wordpress.org/reference/functions/wp_enqueue_script/) API:

```php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'phone-mask',
        get_stylesheet_directory_uri() . '/assets/phone-mask.min.js',
        array(),
        '2.0.0',
        true
    );
    wp_add_inline_script(
        'phone-mask',
        'PhoneMask.init("input[type=tel]", { hint: false });',
        'after'
    );
});
```

This works with accessible HTML `type="tel"` fields in forms. For AJAX forms, Elementor popups, or other builders, call `PhoneMask.init(...)` again after the plugin's opening or rendering event. Disable any competing phone mask supplied by the plugin. If your Content Security Policy prohibits inline scripts, move initialization into a separate permitted script file.

## Webflow and other site builders

Upload the bundle to your static hosting. Add the following to [footer custom code](https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags), after the markup:

```html
<script src="https://your-domain.example/assets/phone-mask.min.js"></script>
<script>
  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    PhoneMask.init('input[type="tel"]', { hint: false });
  });
</script>
```

Replace the example URL with your own. Use a telephone field (`type="tel"`), or supply a custom selector for a text field. The HTML example at the beginning of this README also works in builders that allow custom JavaScript. Custom code availability depends on the platform and plan.

## Shopify

Add the files to your theme's `assets` directory. Insert this before `</body>` in `theme.liquid`:

```liquid
<script src="{{ 'phone-mask.min.js' | asset_url }}"></script>
<script>
  function initPhones(root) {
    PhoneMask.init('input[type="tel"]', { root: root, hint: false });
  }
  initPhones(document);
  document.addEventListener('shopify:section:load', function (event) {
    initPhones(event.target);
  });
  document.addEventListener('shopify:section:unload', function (event) {
    event.target.querySelectorAll('input[type="tel"]').forEach(function (input) {
      PhoneMask.destroy(input);
    });
  });
</script>
```

Section events are described in the [Shopify theme editor documentation](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks). This example applies to fields in the storefront theme. Protected checkout fields and third-party iframes require the platform's supported APIs; theme scripts cannot access them arbitrarily.

## React Native and Node.js

The `phonemask/core` module does not use the DOM, so it can run in JavaScript environments without HTML:

```jsx
import { useState } from 'react';
import { TextInput } from 'react-native';
import { format } from 'phonemask/core';

export default function PhoneField() {
  const [value, setValue] = useState('');
  return <TextInput value={value} keyboardType="phone-pad"
    onChangeText={(text) => setValue(format(text, { defaultCountry: 'UA' }))} />;
}
```

This example formats the value only. The HTML mask's caret handling and hint overlay do not carry over to a native `TextInput`. Editing in the middle of a number in a native input requires a custom selection adapter. In Node.js, use `parse()` to normalize incoming data.

## Dynamic forms and iframes

```js
const controllers = PhoneMask.init('.phone-input', { root: modalElement, hint: false });
// When removing the popup or component:
controllers.forEach((controller) => controller.destroy());
```

New fields are not observed automatically. Call `init` again after inserting them. For Shadow DOM, pass `root: shadowRoot`. For a same-origin iframe, pass its input to `attach`. For a cross-origin iframe, the code must run inside that iframe.

## Hints and styling

`phone-mask.css` expects one input inside `.phone-field`, with matching font, spacing, and text direction between the field and hint. The actual input value stays visible. The hint has `aria-hidden="true"` and is hidden when the field is unfocused, horizontally scrolled, or displayed in forced-colors mode.

The hint uses a sample mobile number for the country. If its format does not match the current input, no hint is shown. The hint does not determine whether the number is acceptable. For custom field styling, browser-specific autofill styling, or multiple inputs in one container, use `hint: false`.

Always provide a visible `<label>`. Use `autocomplete="tel"`. The script adds `inputmode="tel"` if it is not already present. Avoid a small HTML `maxlength`: it also counts `+`, spaces, and parentheses, and can truncate pasted text before the mask receives it.

## Migrating from v1

1. Replace the `src/phone-mask.js` script reference with `dist/phone-mask.min.js`. The existing `PhoneMask.init(selector)` API remains available.
2. Remove manually supplied `.phone-hint` elements and old CSS with `color: transparent`. Each input now gets its own hint, and its actual text stays visible.
3. If you accept Ukrainian numbers starting with `0`, explicitly set `defaultCountry: 'UA'`. National input is now displayed in national format; the international value is available in `international`.
4. Grouping now follows metadata: `+38 (050) 123-45-67` becomes `+380 50 123 4567`.
5. `data-length` is now 15, an international-number guideline rather than an input restriction. Check `isPossible` when you need a possible-length check.
6. Metadata replaces the manual `PHONE_RULES` table. Country rules are no longer edited inside the mask. Nonstandard custom formats require a separate formatter.
7. Call `destroy()` when unmounting a component. Use `setValue()` for programmatic updates.

## Support and limitations

- Targets modern Chrome, Edge, Firefox, Safari, and iOS/Android browsers with ES2020 and standard input events. Internet Explorer is unsupported.
- Automated browser tests cover Chromium, Firefox, WebKit, and Android/iOS device profiles. Emulation does not test actual on-screen keyboards or system autofill; verify those on your target devices.
- CI is configured for Node.js 22/24 on Windows, macOS, and Linux. This describes the test matrix, not a guarantee that every future CI run will pass.
- CMS examples apply to standard HTML inputs. They do not guarantee compatibility with every plugin, theme, closed widget, or hosting plan.
- Formatting does not confirm that a phone number exists. Use a separate verification flow, such as a call or verification code, when required by your application.
- Suffixes such as `;ext=123`, `ext. 123`, and `x123` are excluded from the main number. Store extensions separately. Short service numbers and alphabetic vanity numbers are outside the scope of this formatter.
- The mask updates `input.value`. Undo/redo behavior can vary between browsers, particularly when separators are removed programmatically.

## Development and testing

Requires Node.js 22+ and npm. The commands are the same on Windows, macOS, and Linux:

```sh
npm ci
npm test
npm run test:types
npx playwright install
npm run test:browser
npm run build
npm pack
```

In Linux CI, use `npx playwright install --with-deps`. After installing the browsers, `npm run check` runs all checks. Open `demo/index.html` to try the browser bundle locally without a server.

`src/` contains source code; `dist/` contains reproducible builds. Do not edit generated files manually. `package-lock.json` pins the tooling and phone metadata versions. Update them deliberately, then run the checks and rebuild `dist`.

## License

PhoneMask is [MIT-licensed](LICENSE), by Nicholas Kril. Licenses for bundled components and metadata are included in [THIRD_PARTY_NOTICES.txt](dist/THIRD_PARTY_NOTICES.txt). Keep this file when redistributing the bundle.
