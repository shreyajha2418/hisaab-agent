// One-off consistency check for the synthetic data — not part of the
// build, just a sanity pass to catch typos/wrong references/amount
// mismatches by hand-authoring the JSON files. Run with: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const load = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'));

const customers = load('customers.json');
const bills = load('bills.json');
const razorpayPayments = load('razorpay_payments.json');
const razorpaySettlements = load('razorpay_settlements.json');
const bankStatement = load('bank_statement.json');
const cashVoiceNotes = load('cash_voice_note.json');
const aiOutputs = load('ai_outputs.json');

let errors = 0;
const fail = (msg) => {
  console.error('FAIL:', msg);
  errors++;
};

const customerIds = new Set(customers.map((c) => c.id));
const billsByNumber = new Map(bills.map((b) => [b.billNumber, b]));

// Bills reference real customers
for (const b of bills) {
  if (!customerIds.has(b.customerId)) fail(`Bill ${b.billNumber} references unknown customer ${b.customerId}`);
  if (!['open', 'paid'].includes(b.status)) fail(`Bill ${b.billNumber} has invalid status ${b.status}`);
}

// Open/paid bill counts match the expected "Upload bills" summary
const openCount = bills.filter((b) => b.status === 'open').length;
const paidCount = bills.filter((b) => b.status === 'paid').length;
if (openCount !== 12) fail(`Expected 12 open bills, got ${openCount}`);
if (paidCount !== 3) fail(`Expected 3 already-paid bills, got ${paidCount}`);

// Every ai_outputs event references real bills, and allocation math is
// internally consistent (amountApplied + remainingOnBill === bill.amount,
// sum of amountApplied === event amount for non-flagged/non-set-aside cases).
const validSourceTypes = ['razorpay_payment', 'bank_line', 'cash_note'];
const validConfidence = ['high', 'medium', 'low'];
const validStatus = ['auto_recorded', 'needs_confirmation', 'set_aside'];
const validFlagTypes = ['short_payment', 'overdue', 'not_customer_payment'];

for (const [eventId, out] of Object.entries(aiOutputs)) {
  if (out.eventId !== eventId) fail(`ai_outputs key ${eventId} != eventId field ${out.eventId}`);
  if (!validSourceTypes.includes(out.sourceType)) fail(`${eventId}: invalid sourceType ${out.sourceType}`);
  if (!validStatus.includes(out.status)) fail(`${eventId}: invalid status ${out.status}`);
  if (!validConfidence.includes(out.payerMatch.confidence)) fail(`${eventId}: invalid confidence ${out.payerMatch.confidence}`);
  for (const f of out.flags) {
    if (!validFlagTypes.includes(f.type)) fail(`${eventId}: invalid flag type ${f.type}`);
  }

  let totalApplied = 0;
  for (const line of out.allocation) {
    const bill = billsByNumber.get(line.billNumber);
    if (!bill) {
      fail(`${eventId}: allocation references unknown bill ${line.billNumber}`);
      continue;
    }
    if (line.amountApplied + line.remainingOnBill !== bill.amount) {
      fail(
        `${eventId}: ${line.billNumber} amountApplied(${line.amountApplied}) + remainingOnBill(${line.remainingOnBill}) != bill.amount(${bill.amount})`
      );
    }
    totalApplied += line.amountApplied;
  }

  if (out.status !== 'set_aside' && totalApplied !== out.amount) {
    fail(`${eventId}: sum(amountApplied)=${totalApplied} != event amount ${out.amount}`);
  }
}

// Cross-check specific PRD-required scenarios by eventId
const sharma = aiOutputs['pay_RQ9H3K2L8P4N1X'];
if (sharma.payerMatch.customerId !== 'cust_sharma') fail('Sharma payment not matched to cust_sharma');
if (sharma.status !== 'auto_recorded') fail('Sharma payment should be auto_recorded');

const kapoor = aiOutputs['bank_2'];
if (kapoor.allocation.length !== 1 || kapoor.allocation[0].billNumber !== 'K-301') fail('Kapoor should exact-match K-301 only');

const verma = aiOutputs['voice_001'];
if (verma.allocation.find((l) => l.billNumber === 'V-108')?.remainingOnBill !== 2000) fail('Verma V-108 remaining should be 2000');

const rajeshK = aiOutputs['bank_1'];
if (rajeshK.payerMatch.customerId !== null || rajeshK.payerMatch.suggestedCustomerId !== 'cust_gupta') {
  fail('RAJESH K should be unconfirmed with suggestedCustomerId cust_gupta');
}
const guptaShort = rajeshK.flags.find((f) => f.type === 'short_payment');
if (!guptaShort || guptaShort.shortBy !== 400) fail('RAJESH K / Gupta should flag a 400 short payment');

// Razorpay payment referenced by ai_outputs actually exists
if (!razorpayPayments.find((p) => p.id === 'pay_RQ9H3K2L8P4N1X')) fail('razorpay_payments missing the Sharma payment');

// Settlement UTR matches the bank statement's settlement line reference
const settlementLine = bankStatement.find((l) => l.id === 'bank_3');
if (settlementLine.reference !== razorpaySettlements[0].utr) fail('Settlement UTR does not match bank_3 reference');
if (settlementLine.creditAmount !== razorpaySettlements[0].amount) fail('Settlement amount does not match bank_3 credit');

// Mehta overdue: 45+ days as of "today" (2026-10-04)
const mehtaBill = billsByNumber.get('M-090');
const today = new Date('2026-10-04T00:00:00+05:30');
const daysOverdue = Math.round((today - new Date(mehtaBill.date + 'T00:00:00+05:30')) / 86400000);
console.log(`Mehta M-090 is ${daysOverdue} days old as of 4 Oct 2026 (PRD expects ~45)`);
if (daysOverdue < 40 || daysOverdue > 50) fail(`Mehta overdue days (${daysOverdue}) is outside the expected ~45 range`);

if (cashVoiceNotes[0].transcript !== 'Verma ne 8000 cash diye') fail('Cash voice note transcript mismatch');

console.log(`\n${errors === 0 ? 'ALL CHECKS PASSED' : `${errors} CHECK(S) FAILED`}`);
process.exit(errors === 0 ? 0 : 1);
