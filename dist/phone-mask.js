/*!
 * PhoneMask
 * Lightweight phone number formatter with live hint overlay,
 * country detection and dynamic data attributes.
 *
 * Features:
 *  - Automatic country detection by dial code
 *  - Live formatting while typing
 *  - Smart Backspace handling (digits + separators)
 *  - Hint overlay with remaining mask
 *  - data-length / data-country attributes
 *
 * Author: Nicholas Kril
 * GitHub: https://github.com/NicholasKril/phonemask
 * License: MIT
 * Version: 1.0.0
 */

(function (window, document) {
	const DEFAULT_MAX = '15';
	const DEFAULT_MASK = '+_______________';
	const SEP_REGEX = /[\s\-()]/;
	const DIGIT_REGEX = /\d/;

	const PhoneMask = {
		init(selector = 'input[type="tel"]') {
			document.querySelectorAll(selector).forEach(input => {
				if (!input.__phoneMaskAttached) {
					input.__phoneMaskAttached = true;
					initPhoneField(input);
				}
			});
		}
	};

	function initPhoneField(phoneInput) {

		const field = phoneInput.parentElement;
		if (!field) return;
		phoneInput.dataset.length = DEFAULT_MAX;
		phoneInput.dataset.country = '';
		let hint = field.querySelector('.phone-hint');
		if (!hint) {
			hint = document.createElement('span');
			hint.className = 'phone-hint';
			phoneInput.after(hint);
		}

		let isFormatting = false;
		let isDeleting = false;

		const PHONE_RULES = [
			{code:'AF',dial:'93',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BD',dial:'880',maxDigits:13,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AZ',dial:'994',maxDigits:12,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AM',dial:'374',maxDigits:11,groups:[2,3,3],mask:'+{dial} __ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BY',dial:'375',maxDigits:12,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BH',dial:'973',maxDigits:11,groups:[4,4],mask:'+{dial} ____ ____',format:'+{dial} {g1} {g2}'},
			{code:'BT',dial:'975',maxDigits:10,groups:[3,4],mask:'+{dial} ___ ____',format:'+{dial} {g1} {g2}'},
			{code:'BN',dial:'673',maxDigits:10,groups:[3,4],mask:'+{dial} ___ ____',format:'+{dial} {g1} {g2}'},
			{code:'CF',dial:'236',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'TD',dial:'235',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'KM',dial:'269',maxDigits:10,groups:[3,4],mask:'+{dial} ___ ____',format:'+{dial} {g1} {g2}'},
			{code:'CV',dial:'238',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AL',dial:'355',maxDigits:12,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'DZ',dial:'213',maxDigits:12,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AO',dial:'244',maxDigits:12,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AR',dial:'54',maxDigits:13,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AU',dial:'61',maxDigits:11,groups:[1,4,4],mask:'+{dial} _ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'AT',dial:'43',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BE',dial:'32',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BJ',dial:'229',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BO',dial:'591',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BA',dial:'387',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BR',dial:'55',maxDigits:13,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'BG',dial:'359',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CM',dial:'237',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CA',dial:'1',maxDigits:11,groups:[3,3,4],mask:'+{dial} ___ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CN',dial:'86',maxDigits:13,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CO',dial:'57',maxDigits:12,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'HR',dial:'385',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CU',dial:'53',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CY',dial:'357',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CZ',dial:'420',maxDigits:12,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'DK',dial:'45',maxDigits:10,groups:[4,4],mask:'+{dial} ____ ____',format:'+{dial} {g1} {g2}'},
			{code:'EE',dial:'372',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'FI',dial:'358',maxDigits:12,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'FR',dial:'33',maxDigits:11,groups:[1,2,2,2,2],mask:'+{dial} _ __ __ __ __',format:'+{dial} {g1} {g2} {g3} {g4} {g5}'},
			{code:'DE',dial:'49',maxDigits:13,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'GR',dial:'30',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'HU',dial:'36',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'IE',dial:'353',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'IL',dial:'972',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'IT',dial:'39',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'JP',dial:'81',maxDigits:11,groups:[2,4,4],mask:'+{dial} __ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'LV',dial:'371',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'LT',dial:'370',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'LU',dial:'352',maxDigits:11,groups:[3,4,4],mask:'+{dial} ___ ____ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'MD',dial:'373',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'ME',dial:'382',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'NL',dial:'31',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'NO',dial:'47',maxDigits:10,groups:[4,4],mask:'+{dial} ____ ____',format:'+{dial} {g1} {g2}'},
			{code:'PL',dial:'48',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'PT',dial:'351',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'RO',dial:'40',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'RS',dial:'381',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'SK',dial:'421',maxDigits:12,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'SI',dial:'386',maxDigits:11,groups:[2,3,4],mask:'+{dial} __ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'ES',dial:'34',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'SE',dial:'46',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CH',dial:'41',maxDigits:11,groups:[3,3,3],mask:'+{dial} ___ ___ ___',format:'+{dial} {g1} {g2} {g3}'},
			{code:'TR',dial:'90',maxDigits:11,groups:[3,3,4],mask:'+{dial} ___ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'UA',dial:'38',localPrefix:'0',maxDigits:12,groups:[3,3,2,2],mask:'+{dial} (___) ___-__-__',format:'+{dial} ({g1}) {g2}-{g3}-{g4}'},
			{code:'GB',dial:'44',maxDigits:11,groups:[4,3,4],mask:'+{dial} ____ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'US',dial:'1',maxDigits:11,groups:[3,3,4],mask:'+{dial} ___ ___ ____',format:'+{dial} {g1} {g2} {g3}'},
			{code:'CA',dial:'1',maxDigits:11,groups:[3,3,4],mask:'+{dial} ___ ___ ____',format:'+{dial} {g1} {g2} {g3}'}
		];

		const getDigits = v => v.replace(/\D/g, '');

		function getActiveRule(value) {
			const digits = getDigits(value);
			for (const rule of PHONE_RULES) {
				if (rule.localPrefix && digits.startsWith(rule.localPrefix)) return rule;
				if (digits.startsWith(rule.dial)) return rule;
			}
			return null;
		}

		function caretAfterLastDigit(value) {
			for (let i = value.length - 1; i >= 0; i--) {
				if (DIGIT_REGEX.test(value[i])) return i + 1;
			}
			return value.length;
		}

		function formatPhone(value) {
			if (!value) return '';
			if (value === '+') return '+';

			let digits = getDigits(value);
			if (!digits) return value.startsWith('+') ? '+' : '';

			const rule = getActiveRule(value);
			if (!rule) return '+' + digits.slice(0, DEFAULT_MAX);

			if (rule.localPrefix && digits.startsWith(rule.localPrefix)) {
				digits = rule.dial + digits;
			}

			digits = digits.slice(0, rule.maxDigits);

			let rest = digits.slice(rule.dial.length);
			let pos = 0;

			const groups = rule.groups.map(size => {
				const part = rest.slice(pos, pos + size);
				pos += size;
				return part;
			});

			let out = rule.format.replace('{dial}', rule.dial);
			groups.forEach((g, i) => {
				out = out.replace(`{g${i + 1}}`, g || '');
			});

			return out.replace(/[()\-\s]+$/, '');
		}

		function applyFormat() {
			if (isFormatting || isDeleting) return;

			isFormatting = true;

			const start = phoneInput.selectionStart;
			const oldValue = phoneInput.value;
			const newValue = formatPhone(oldValue);

			if (oldValue !== newValue) {
				const diff = newValue.length - oldValue.length;
				phoneInput.value = newValue;
				phoneInput.setSelectionRange(start + diff, start + diff);
			}

			isFormatting = false;
		}

		function updatePhoneHint() {
			const value = phoneInput.value;
			const focused = document.activeElement === phoneInput;

			if (!value && !focused) {
				hint.innerHTML = '';
				phoneInput.style.color = 'transparent';
				phoneInput.dataset.length = DEFAULT_MAX;
				phoneInput.dataset.country = '';
				return;
			}

			if (!value && focused) {
				hint.innerHTML = `<span class="hint-remaining">${DEFAULT_MASK}</span>`;
				phoneInput.style.color = 'transparent';
				phoneInput.dataset.length = DEFAULT_MAX;
				phoneInput.dataset.country = '';
				return;
			}

			const display = formatPhone(value);
			const rule = getActiveRule(display);

			if (!rule) {
				const val = value.startsWith('+') ? value : '+' + getDigits(value);
				hint.innerHTML =
					`<span class="hint-entered">${val}</span>` +
					`<span class="hint-remaining">${DEFAULT_MASK.slice(val.length)}</span>`;
				phoneInput.dataset.length = DEFAULT_MAX;
				phoneInput.dataset.country = '';
				phoneInput.style.color = 'transparent';
				return;
			}

			phoneInput.dataset.length = rule.maxDigits;
			phoneInput.dataset.country = rule.code;

			const mask = rule.mask.replace('{dial}', rule.dial);
			hint.innerHTML =
				`<span class="hint-entered">${display}</span>` +
				`<span class="hint-remaining">${mask.slice(display.length)}</span>`;
		}

		phoneInput.addEventListener('keydown', e => {

			if (e.key !== 'Backspace') {
				isDeleting = false;
				return;
			}

			const pos = phoneInput.selectionStart;
			const value = phoneInput.value;

			if (pos === 1 && value[0] === '+') {
				e.preventDefault();
				phoneInput.value = '';
				updatePhoneHint();
				isDeleting = true;
				return;
			}

			if (pos === 0) return;

			e.preventDefault();

			let start = pos - 1;

			if (SEP_REGEX.test(value[start])) start--;
			if (start >= 0 && DIGIT_REGEX.test(value[start])) start--;

			const newValue = value.slice(0, start + 1) + value.slice(pos);
			const formatted = formatPhone(newValue);

			phoneInput.value = formatted;
			phoneInput.setSelectionRange(
				caretAfterLastDigit(formatted),
				caretAfterLastDigit(formatted)
			);

			updatePhoneHint();
			isDeleting = true;
		});

		phoneInput.addEventListener('input', () => {
			if (isDeleting) {
				isDeleting = false;
				return;
			}
			applyFormat();
			updatePhoneHint();
		});

		phoneInput.addEventListener('paste', () => {
			setTimeout(() => {
				applyFormat();
				updatePhoneHint();
			}, 0);
		});

		phoneInput.addEventListener('focus', () => {
			setTimeout(() => {
				applyFormat();
				updatePhoneHint();
			}, 0);
		});

		phoneInput.addEventListener('blur', updatePhoneHint);
	}

	window.PhoneMask = PhoneMask;

})(window, document);