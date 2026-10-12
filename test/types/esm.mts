import PhoneMask, { attach, type PhoneValue } from 'phonemask';
import { format } from 'phonemask/core';
const input = document.createElement('input');
const mask = attach(input, { defaultCountry: 'UA', onChange: (value) => value.international });
const value: PhoneValue = mask.setValue('+380501234567');
PhoneMask.init([input]).forEach((controller) => controller.destroy());
format(value.formatted);
