import { format, parse, getCountries, normalize, resolveOptions } from './core.js';

export { format, parse, getCountries };
const instances = new WeakMap();
const attributes = ['data-country', 'data-length', 'data-phone-possible', 'inputmode'];
const isDigit = (char) => /\d/.test(char || '');
const tokens = (text) => normalize(text).replace(/[^\d+]/g, '').length;

function caretAt(value, count) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/[\d+]/.test(value[i]) && ++seen === count) return i + 1;
  }
  return value.length;
}

/** Attach once. Use destroy() before changing options. */
export function attach(input, options = {}) {
  if (!input || input.tagName !== 'INPUT' || !['tel', 'text', 'search'].includes(input.type)) {
    throw new TypeError('PhoneMask.attach expects an input of type tel, text, or search');
  }
  if (instances.has(input)) return instances.get(input);
  const settings = resolveOptions(options);
  const doc = input.ownerDocument;
  const view = doc.defaultView;
  const original = new Map(attributes.map((name) => [name, input.getAttribute(name)]));
  const listeners = [];
  let state;
  let composing = false;
  let destroyed = false;
  let resetTimer;
  let deferredDeletion;
  let hint;
  let hintText;
  let hintEntered;

  // A separate, optional hint never hides or replaces the actual input text.
  if (settings.hint !== false) {
    hint = doc.createElement('span');
    hint.className = 'phone-hint';
    hint.setAttribute('aria-hidden', 'true');
    hintEntered = doc.createElement('span');
    hintEntered.className = 'hint-entered';
    hintEntered.style.visibility = 'hidden';
    hintText = doc.createElement('span');
    hintText.className = 'hint-remaining';
    hint.append(hintEntered, hintText);
    input.after(hint);
  }
  if (!input.hasAttribute('inputmode')) input.setAttribute('inputmode', 'tel');

  function listen(target, name, handler) {
    target.addEventListener(name, handler);
    listeners.push(() => target.removeEventListener(name, handler));
  }

  function paintHint() {
    if (!hint) return;
    const focused = (input.getRootNode().activeElement || doc.activeElement) === input;
    hint.hidden = !focused || input.scrollLeft !== 0 || (!input.value && Boolean(input.placeholder));
    hintEntered.textContent = state.formatted;
    hintText.textContent = state.hint;
  }

  function apply(preserveSelection = true, notify = false) {
    if (destroyed || composing) return state;
    const previous = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const direction = input.selectionDirection;
    state = parse(previous, settings);
    if (previous !== state.formatted) {
      input.value = state.formatted;
      if (preserveSelection && start !== null && end !== null) {
        const delta = tokens(state.formatted) - tokens(previous);
        const map = (position) => position === 0 ? 0 : caretAt(state.formatted,
          Math.max(0, tokens(previous.slice(0, position)) + delta));
        input.setSelectionRange(map(start), map(end), direction || 'none');
      }
    }
    input.dataset.country = state.country;
    input.dataset.length = String(state.maxDigits);
    input.dataset.phonePossible = String(state.isPossible);
    paintHint();
    if (notify) {
      const detail = { ...state };
      input.dispatchEvent(new view.CustomEvent('phonemask:change', { detail, bubbles: true, composed: true }));
      settings.onChange?.(detail, input);
    }
    return { ...state };
  }

  function emitInput(inputType) {
    input.dispatchEvent(new view.InputEvent('input', { bubbles: true, composed: true, inputType }));
  }

  function deleteAcrossSeparator(event, backward) {
    if (destroyed || composing || event.isComposing || input.readOnly || input.disabled || event.defaultPrevented) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (start === null || start !== end) return;
    const value = input.value;
    let index = backward ? start - 1 : start;
    if (index < 0 || index >= value.length || isDigit(value[index]) || value[index] === '+') return;
    while (index >= 0 && index < value.length && !isDigit(value[index])) index += backward ? -1 : 1;
    if (index < 0 || index >= value.length) return;
    const from = backward ? index : start;
    const to = backward ? start : index + 1;
    if (!event.cancelable) {
      deferredDeletion = { value, from, to };
      return;
    }
    event.preventDefault();
    input.value = value.slice(0, from) + value.slice(to);
    input.setSelectionRange(from, from);
    emitInput(backward ? 'deleteContentBackward' : 'deleteContentForward');
  }

  listen(input, 'beforeinput', (event) => {
    deferredDeletion = undefined;
    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      deleteAcrossSeparator(event, event.inputType === 'deleteContentBackward');
    }
  });
  if (!('onbeforeinput' in input)) {
    listen(input, 'keydown', (event) => {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && ['Backspace', 'Delete'].includes(event.key)) {
        deleteAcrossSeparator(event, event.key === 'Backspace');
      }
    });
  }
  listen(input, 'input', (event) => {
    const deletion = deferredDeletion;
    deferredDeletion = undefined;
    if (composing || event.isComposing) return;
    // Some virtual keyboards deliver non-cancelable beforeinput events.
    if (deletion && !input.readOnly && !input.disabled &&
        input.value.replace(/\D/g, '') === deletion.value.replace(/\D/g, '')) {
      input.value = deletion.value.slice(0, deletion.from) + deletion.value.slice(deletion.to);
      input.setSelectionRange(deletion.from, deletion.from);
    }
    apply(true, true);
  });
  listen(input, 'change', () => apply(true, true));
  listen(input, 'compositionstart', () => { composing = true; });
  listen(input, 'compositionend', () => { composing = false; apply(true, true); });
  listen(input, 'focus', () => apply());
  listen(input, 'blur', paintHint);
  listen(input, 'scroll', paintHint);
  if (input.form) {
    listen(input.form, 'reset', (event) => {
      view.clearTimeout(resetTimer);
      resetTimer = view.setTimeout(() => { if (!event.defaultPrevented) apply(false, true); }, 0);
    });
  }

  const controller = {
    input,
    getValue: () => ({ ...state }),
    setValue(value, { emit = false } = {}) {
      if (destroyed) throw new Error('PhoneMask: this controller has been destroyed');
      input.value = String(value ?? '');
      composing = false;
      apply(false);
      if (emit) emitInput('insertReplacementText');
      return { ...state };
    },
    refresh: () => apply(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.clearTimeout(resetTimer);
      listeners.forEach((remove) => remove());
      hint?.remove();
      original.forEach((value, name) => value === null ? input.removeAttribute(name) : input.setAttribute(name, value));
      instances.delete(input);
    },
  };
  instances.set(input, controller);
  apply(false);
  return controller;
}

export function init(target = 'input[type="tel"]', options = {}) {
  if (typeof target === 'string') {
    const root = options.root || (typeof document !== 'undefined' ? document : undefined);
    if (!root) return [];
    target = root.querySelectorAll(target);
  }
  if (target?.tagName === 'INPUT') return [attach(target, options)];
  return Array.from(target || [], (input) => attach(input, options));
}

export function destroy(target) {
  instances.get(target)?.destroy();
}

const PhoneMask = { init, attach, destroy, format, parse, getCountries };
export default PhoneMask;
