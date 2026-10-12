import { format, parse, type PhoneValue } from 'phonemask/core';
const phone: PhoneValue = parse('0501234567', { defaultCountry: 'UA' });
format(phone.international);
