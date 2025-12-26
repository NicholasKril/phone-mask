# PhoneMask

**PhoneMask** is a lightweight JavaScript library for smart phone number input formatting with live hint overlay, automatic country detection and precise caret control.

Built for production use where UX details actually matter.

---

## ✨ Features

- 📞 Automatic country detection by dial code
- 🧠 Intelligent formatting while typing
- ⌫ Smart Backspace behavior  
  (digits and separators like space, `(`, `)` and `-` are removed together)
- 💡 Live hint overlay with remaining mask
- 🎯 Correct caret positioning at all times
- 🌍 Support for 200+ countries (configurable rules)
- 🏷 Dynamic `data-length` and `data-country` attributes
- ⚙️ Zero dependencies
- 🧩 Multiple inputs on the same page supported
- 🚀 Production-ready and framework-agnostic

---

## 📦 Installation

### Via `<script>`

```html
<script src="phone-mask.js"></script>
```

### Manual install

Just copy the single JavaScript file into your project.

---

## 🚀 Usage

### Basic HTML

```html
<div class="phone-field">
    <input type="tel" placeholder="" class="phone-input">
</div>
```

The `.phone-hint` element will be created automatically if it does not exist.

---

### Initialize

```js
PhoneMask.init(); // default: all input[type="tel"]
```

Or use a custom selector:

```js
PhoneMask.init('.phone-input');
```

---

## 🧠 How It Works

1. User types digits freely.
2. PhoneMask automatically:
   - detects the country by dial code
   - formats the number according to country rules
   - displays the remaining mask as a live hint
   - keeps the caret in the correct position
3. When pressing Backspace:
   - digits and formatting characters are removed together
   - no cursor jumps or broken formatting

---

## 🏷 Data Attributes

PhoneMask updates the input element dynamically:

| Attribute | Description |
|---------|-------------|
| `data-length` | Maximum number of digits for the detected country |
| `data-country` | ISO country code (e.g. `UA`, `PL`, `US`) |

If the country is not detected:

- `data-length="15"`
- `data-country=""`

---

## 🌍 Country Rules

Each country is defined declaratively:

```js
{
    code: 'UA',
    dial: '38',
    localPrefix: '0',
    maxDigits: 12,
    groups: [3, 3, 2, 2],
    mask: '+{dial} (___) ___-__-__',
    format: '+{dial} ({g1}) {g2}-{g3}-{g4}'
}
```

You can easily add, remove or override country rules.

---

## 🎨 Styling the Hint

Minimal example:

```css
.phone-field {
    position: relative;
}

.phone-hint {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    white-space: pre;
    color: #a1a5b7;
}

.phone-hint .hint-entered {
    color: #4d5673;
}

.phone-field input {
    position: relative;
    background: transparent;
    color: transparent;
    caret-color: #0f172a;
}
```

---

## 🔒 Browser Support

- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers (iOS / Android)

---

## 📄 License

MIT License

---

## 👤 Author

**Nicholas Kril**  

GitHub: https://github.com/NicholasKril

---

## ⭐ Contributing

Contributions are welcome:
- new country rules
- edge-case fixes
- performance improvements
- documentation updates

Open a pull request anytime.

---

## ❤️ Final Notes

PhoneMask was built to solve UX problems that most phone mask libraries ignore:
cursor jumps, broken backspace behavior and poor mobile experience.

If you care about details — this library is for you.
