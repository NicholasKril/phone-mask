# PhoneMask 2

Універсальний JavaScript-форматувальник телефонних номерів для звичайних сайтів, CMS, React, Vue, Next.js та серверного JavaScript. Готовий браузерний файл працює самостійно: додаткових скриптів або мережевих запитів під час введення немає.

Версія 2 розвиває [PhoneMask 1.0.0](https://github.com/NicholasKril/phone-mask/tree/143410c): виправляє редагування номера, замінює ручну таблицю країн і додає модульне використання. Це **мажорне оновлення** — перед заміною v1 прочитайте розділ «Перехід із v1».

## Можливості

- Форматування під час введення, вставлення та автозаповнення через `input` / `change`.
- Редагування посеред номера, виділення, Backspace та Delete біля розділювачів.
- Обробка `beforeinput` і IME/composition, без залежності від фізичної клавіатури.
- Міжнародні номери з `+` або `00`, національні номери з явною країною.
- Нормалізація повноширинних, арабських та перських цифр.
- Метадані понад 200 країн і територій, без обрізання номера до помилково вгаданої довжини.
- Окрема підказка, яка не приховує текст поля та не дублюється для читачів екрана.
- Повторна ініціалізація без дублювання, очищення через `destroy()`, підтримка динамічних форм.
- Browser global, ESM, CommonJS, типи TypeScript та окремий модуль без DOM.

Міжнародні формати й приклади походять із [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js). Бібліотека та мінімальні метадані включені в `dist`; це **не zero-dependency реалізація**, хоча готові файли не потребують окремого встановлення залежностей. Поточний `phone-mask.min.js`: приблизно 151 КБ, або 37 КБ із gzip. Повний набір країн збільшує розмір порівняно з v1.

## Швидкий старт: HTML

Скопіюйте з `dist/` файли `phone-mask.min.js`, `phone-mask.css` і `THIRD_PARTY_NOTICES.txt` у каталог ресурсів сайту. CSS потрібен лише для підказки поверх поля.

```html
<link rel="stylesheet" href="/assets/phone-mask.css">

<label for="phone">Телефон</label>
<div class="phone-field">
  <input id="phone" name="phone" type="tel" autocomplete="tel"
         aria-describedby="phone-help">
</div>
<p id="phone-help">Введіть номер із кодом країни, наприклад +380.</p>

<!-- Підключіть після розмітки форми, перед закриттям body. -->
<script src="/assets/phone-mask.min.js"></script>
<script>
  const masks = PhoneMask.init();
</script>
```

За замовчуванням `PhoneMask.init()` обробляє всі `input[type="tel"]`, наявні в момент виклику. Автоматичного запуску немає. Для завантаження в `<head>` використовуйте `defer` і окремий файл ініціалізації також із `defer`, після бібліотеки.

Якщо оформленням керує ваша CMS або дизайн-система, вимкніть підказку — додатковий CSS не потрібен:

```js
PhoneMask.init('input[type="tel"]', { hint: false });
```

Для українських номерів у національному форматі:

```js
PhoneMask.init('.phone-input', { defaultCountry: 'UA', hint: false });
// 0501234567 → 050 123 4567
// +48512345678 → +48 512 345 678
```

Без `defaultCountry` цифри трактуються як міжнародний номер: `380501234567` → `+380 50 123 4567`. Префікс `0` сам по собі не визначає країну. З `defaultCountry` номер без `+` є національним; міжнародний номер краще передавати з `+`.

## Встановлення в JavaScript-проєкт

Із завантаженого пакета v2:

```sh
npm install ./phonemask-2.0.0.tgz
```

Або з локальної копії цього репозиторію:

```sh
npm ci
npm pack
# У каталозі свого застосунку:
npm install /path/to/phone-mask/phonemask-2.0.0.tgz
```

README не передбачає, що v2 вже опублікована в npm: команда `npm install phonemask` може встановити інший або старіший пакет. Для цієї версії використовуйте її архів.

```js
// ESM / Vite / webpack / Rollup
import PhoneMask, { attach, format, parse } from 'phonemask';
import 'phonemask/style.css'; // необов'язково, лише для підказки

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

Для нативного browser ESM імпортуйте `./dist/phone-mask.mjs` з HTTP(S)-сервера. Усі залежності вже включені. `src/` призначений для розробки та потребує збірки.

## API

### Підключення

```js
const [mask] = PhoneMask.init('#phone', { defaultCountry: 'UA' });
const sameMask = PhoneMask.attach(document.querySelector('#phone'));
```

`init(target?, options?)` повертає масив контролерів. `target` може бути CSS-селектором, одним input, NodeList або масивом input. Підтримуються типи `tel`, `text`, `search`; `number` не підтримується, бо не має потрібної роботи з курсором.

| Опція | Тип / типове значення | Призначення |
| --- | --- | --- |
| `defaultCountry` | рядок / не задано | Код із `PhoneMask.getCountries()`, наприклад `UA`, `PL`, `US`. Регістр неважливий. |
| `hint` | boolean / `true` | Створювати візуальну підказку. |
| `root` | Document, Element, ShadowRoot / document | Де шукати селектор для `init`. |
| `onChange` | `(value, input) => void` | Отримувати актуальний результат після введення, `change` та reset. |

Повторний `attach` / `init` повертає наявний контролер і **не змінює його опції**. Щоб змінити країну або підказку, викличте `destroy()` і підключіть маску знову.

### Контролер

```js
mask.setValue('+380501234567');                // без подій
mask.setValue('+48512345678', { emit: true }); // подія input + сповіщення маски
const value = mask.getValue();
mask.refresh();                              // після прямого input.value = ...
mask.destroy();                              // прибрати обробники, підказку й атрибути маски
PhoneMask.destroy(document.querySelector('#phone')); // еквівалент
```

`destroy()` залишає відформатоване значення, відновлює попередні службові атрибути та може безпечно викликатися повторно. Після нього створіть новий контролер, щоб відновити маску. Звичайне присвоєння `input.value` не генерує подій браузера — використовуйте `setValue` або `refresh`.

### Форматування без поля

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

`format()` повертає рядок; `parse()` і методи контролера повертають результат вище. `international` може бути порожнім або неповним під час введення. `isPossible` перевіряє **можливу довжину**, а не існування, власника чи досяжність номера. Це не сувора перевірка всіх телефонних діапазонів.

Завеликий номер залишається в полі з `isPossible: false`, щоб користувач міг виправити його без прихованої втрати цифр. `maxDigits: 15` — орієнтир для міжнародного номера; це не примусове обмеження поля. `country` порожня, якщо країна ще неоднозначна або код негеографічний. Наприклад, `+1` не означає автоматично Канаду чи США.

### Події та відправлення форми

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

Додайте `<input type="hidden" id="phone-international" name="phone_international">`, якщо серверу потрібен міжнародний номер без пробілів. Саме поле `name="phone"` надсилає **відформатований** текст. Маска не перехоплює submit і не замінює серверну перевірку. `phonemask:change` спливає, проходить межу Shadow DOM і має результат у `event.detail`.

Службові атрибути: `data-country`, `data-length="15"`, `data-phone-possible="true|false"`. Для інтеграцій використовуйте callback або подію, а не опитування через `setInterval`.

## React та Next.js

DOM-маску підключайте в effect до **неконтрольованого** input. Не поєднуйте її з `value={state}` або другою маскою на тому самому полі. Про модель поля: [документація React](https://react.dev/reference/react-dom/components/input).

```jsx
'use client'; // потрібно в Next.js App Router

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
    return () => mask.destroy(); // зокрема для Strict Mode
  }, []);

  return (
    <label>
      Телефон
      <input ref={inputRef} type="tel" name="phone" autoComplete="tel" />
      <input type="hidden" name="phone_international" value={international} />
    </label>
  );
}
```

Імпорт безпечний під час SSR: модуль не звертається до `window` / `document` при завантаженні. `init()` із селектором без DOM повертає `[]`. Підключення до реального input виконується на клієнті. Для повністю контрольованого компонента використовуйте `phonemask/core` і керуйте виділенням засобами свого компонента.

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
    Телефон
    <input ref="input" type="tel" name="phone" autocomplete="tel">
    <input type="hidden" name="phone_international" :value="international">
  </label>
</template>
```

Не додавайте `v-model` до input, яким керує DOM-маска. Зовнішнє оновлення значення виконуйте через `mask.setValue(...)`. У Nuxt цей приклад підключається лише в `onMounted`, тож серверний рендеринг не звертається до DOM.

## WordPress

Скопіюйте `phone-mask.min.js` і файл повідомлень ліцензій у `assets/` **дочірньої теми**. Додайте в її `functions.php` через стандартний [wp_enqueue_script](https://developer.wordpress.org/reference/functions/wp_enqueue_script/):

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

Підходить для доступних HTML-полів `type="tel"` у формах. Для AJAX-форм, попапів Elementor або інших конструкторів повторіть `PhoneMask.init(...)` після події відкриття/рендерингу конкретного плагіна. Не вмикайте водночас його власну телефонну маску. Якщо політика CSP забороняє inline-скрипти, перенесіть ініціалізацію в окремий дозволений файл.

## Webflow та інші конструктори

Завантажте готовий файл на свій статичний хостинг. У [footer custom code](https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags) після розмітки:

```html
<script src="https://your-domain.example/assets/phone-mask.min.js"></script>
<script>
  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    PhoneMask.init('input[type="tel"]', { hint: false });
  });
</script>
```

Замініть демонстраційну адресу на свою. Поле має бути телефонним (`type="tel"`) або використовуйте власний селектор для текстового поля. Універсальний HTML-приклад на початку README працює також у конструкторах, де дозволений власний JavaScript. Доступність custom code залежить від платформи й тарифу.

## Shopify

Додайте файли до `assets` теми. Перед `</body>` в `theme.liquid`:

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

Події секцій описані в [документації редактора тем Shopify](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks). Приклад стосується полів у темі storefront. Захищені checkout-поля та сторонні iframe потребують дозволених API відповідної платформи; скрипт теми не має до них довільного доступу.

## React Native та Node.js

Модуль `phonemask/core` не використовує DOM, тому його можна викликати в JavaScript-середовищах без HTML:

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

Це приклад форматування значення; керування курсором і підказка HTML-маски не переносяться в нативний `TextInput`. Для нативного редагування посеред номера потрібен власний адаптер виділення. У Node.js використовуйте `parse()` для нормалізації отриманих даних.

## Динамічні форми та iframe

```js
const controllers = PhoneMask.init('.phone-input', { root: modalElement, hint: false });
// Коли попап або компонент видаляється:
controllers.forEach((controller) => controller.destroy());
```

Нові поля не спостерігаються автоматично. Повторіть `init` після їх додавання. Для Shadow DOM передайте `root: shadowRoot`. Для same-origin iframe можна передати його input у `attach`; у cross-origin iframe код має працювати всередині самого iframe.

## Підказка та стилі

`phone-mask.css` розрахований на один input у `.phone-field` і однакові шрифт, відступ та напрямок тексту поля й підказки. Значення залишається видимим. Підказка має `aria-hidden="true"`, ховається без фокуса, під час горизонтального прокручування й у режимі примусових кольорів.

Підказка використовує приклад мобільного номера країни. Якщо його формат не збігається з поточним введенням, підказка не показується; вона не визначає допустимість номера. Для незвичайних стилів, автозаповнення зі специфічним оформленням або кількох полів в одному контейнері рекомендовано `hint: false`.

Завжди додавайте видимий `<label>`. Використовуйте `autocomplete="tel"`. Скрипт додає `inputmode="tel"`, якщо атрибута ще немає. Не встановлюйте малий HTML `maxlength`: він рахує також `+`, пробіли й дужки та може обрізати вставлення ще до маски.

## Перехід із v1

1. Замініть підключення `src/phone-mask.js` на `dist/phone-mask.min.js`. Старий `PhoneMask.init(selector)` залишається доступним.
2. Видаліть власні старі `.phone-hint` і CSS із `color: transparent`. Тепер кожне поле отримує свою підказку, а текст залишається видимим.
3. Якщо приймаєте українські номери з `0`, явно задайте `defaultCountry: 'UA'`. Національне введення тепер відображається національно; міжнародне значення доступне в `international`.
4. Формат групування тепер визначають метадані: `+38 (050) 123-45-67` стане `+380 50 123 4567`.
5. `data-length` тепер дорівнює 15 — міжнародний орієнтир, а не заборона введення. Перевіряйте `isPossible`, якщо потрібна можлива довжина номера.
6. Ручна таблиця `PHONE_RULES` замінена метаданими. Правила країн не редагуються всередині маски. Для власного нестандартного формату потрібен окремий форматувальник.
7. Під час демонтування компонента викликайте `destroy()`. Для програмної зміни номера використовуйте `setValue()`.

## Межі підтримки

- Ціль: сучасні Chrome, Edge, Firefox, Safari та браузери iOS/Android із ES2020 і стандартними подіями input. Internet Explorer не підтримується.
- Автотести: Chromium, Firefox, WebKit та мобільні профілі Android/iOS. Емуляція не перевіряє справжні екранні клавіатури й системне автозаповнення — їх слід перевірити на цільових пристроях.
- CI налаштований на Node.js 22/24 у Windows, macOS і Linux. Це конфігурація перевірки, а не твердження, що кожен запуск CI уже виконаний.
- CMS-приклади стосуються звичайних HTML-полів, а не гарантують сумісність із кожним плагіном, темою, закритим віджетом або тарифом.
- Форматування не підтверджує існування номера. Для цього потрібна окрема бізнес-перевірка, наприклад підтвердження дзвінком або кодом.
- Суфікси `;ext=123`, `ext. 123`, `x123` не включаються в основний номер; розширення зберігайте окремо. Короткі сервісні номери та буквені vanity-номери не є ціллю цього форматувальника.
- Маска змінює `input.value`; історія undo/redo може відрізнятися між браузерами, особливо для програмного видалення розділювачів.

## Розробка та перевірка

Потрібні Node.js 22+ і npm. Команди однакові для Windows, macOS та Linux:

```sh
npm ci
npm test
npm run test:types
npx playwright install
npm run test:browser
npm run build
npm pack
```

У Linux CI використовуйте `npx playwright install --with-deps`. `npm run check` запускає всі перевірки після встановлення браузерів. Відкрийте `demo/index.html`, щоб перевірити готовий файл локально без сервера.

`src/` — вихідний код; `dist/` — відтворювані готові файли. Не редагуйте зібрані файли вручну. `package-lock.json` фіксує версії інструментів і телефонних метаданих. Оновлюйте їх свідомо, після чого запускайте перевірки та перебудовуйте `dist`.

## Ліцензія

PhoneMask — [MIT](LICENSE), Nicholas Kril. Повідомлення про ліцензії включених компонентів і метаданих: [THIRD_PARTY_NOTICES.txt](dist/THIRD_PARTY_NOTICES.txt). Зберігайте цей файл під час поширення готової збірки.
