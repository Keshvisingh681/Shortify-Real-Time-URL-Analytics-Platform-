"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBase62Code = generateBase62Code;
const BASE62_CHARACTERS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
/**
 * Generates a random Base62 short code of a given length.
 * Base62 is ideal for URL shortening because it is alphanumeric and case-sensitive,
 * providing 62^6 (approx 56.8 billion) combinations for a 6-character code.
 */
function generateBase62Code(length = 6) {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * BASE62_CHARACTERS.length);
        result += BASE62_CHARACTERS[randomIndex];
    }
    return result;
}
