import type { Customer } from '../types';

export interface ParsedVoicePayment {
  customerId: string | null;
  rawLabel: string;
  amount: number | null;
}

const ONES: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/** Best-effort "eight thousand four hundred" -> 8400 — a fallback for when
 * the recognizer spells a number out as words instead of digits. Chrome's
 * English recognizers usually already return digits, so this mainly covers
 * the odd phrasing a live mic will produce. */
function wordsToNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let found = false;

  for (const word of words) {
    if (word in ONES) {
      current += ONES[word];
      found = true;
    } else if (word in TENS) {
      current += TENS[word];
      found = true;
    } else if (word === 'hundred') {
      current = (current || 1) * 100;
      found = true;
    } else if (word === 'thousand') {
      total += (current || 1) * 1000;
      current = 0;
      found = true;
    }
  }

  return found ? total + current : null;
}

function extractAmount(transcript: string): number | null {
  const digitMatch = transcript.match(/\d[\d,]*/);
  if (digitMatch) {
    const n = parseInt(digitMatch[0].replace(/,/g, ''), 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const fromWords = wordsToNumber(words);
  return fromWords && fromWords > 0 ? fromWords : null;
}

function extractCustomer(transcript: string, customers: Customer[]): Customer | undefined {
  const lower = transcript.toLowerCase();
  return customers.find((c) => {
    const shopToken = c.name.split(' ')[0].toLowerCase();
    const ownerToken = c.ownerName.split(' ')[0].toLowerCase();
    return lower.includes(shopToken) || lower.includes(ownerToken);
  });
}

/** Turns a (real or scripted) voice-note transcript into a payer + amount.
 * Simple name/number matching, not AI — same spirit as allocateOldestFirst:
 * genuinely computed because it has to handle whatever Aman actually says,
 * which can't be pre-computed for a live recording. */
const MAX_RAW_LABEL_LENGTH = 40;

export function parseVoicePayment(transcript: string, customers: Customer[]): ParsedVoicePayment {
  const customer = extractCustomer(transcript, customers);
  const amount = extractAmount(transcript);
  const trimmed = transcript.trim();
  // rawLabel doubles as the screen title when unmatched (same pattern as
  // "RAJESH K"), so a long transcript gets capped rather than running the
  // whole sentence into a header.
  const rawLabel =
    trimmed.length > MAX_RAW_LABEL_LENGTH ? `${trimmed.slice(0, MAX_RAW_LABEL_LENGTH)}…` : trimmed || 'Voice note';
  return {
    customerId: customer?.id ?? null,
    rawLabel,
    amount,
  };
}
