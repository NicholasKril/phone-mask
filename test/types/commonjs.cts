import PhoneMask = require('phonemask');
import core = require('phonemask/core');
const value: string = PhoneMask.format('+380501234567');
core.parse(value).isPossible;
