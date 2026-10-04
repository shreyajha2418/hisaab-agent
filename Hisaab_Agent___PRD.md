# Hisaab Agent — PRD

Oct 4, 2026 · @shreya

## TL;DR

**Hisaab Agent** is an AI agent inside Razorpay that turns every rupee a B2B merchant receives into an answer: which bills it paid, and who still owes what. *Hisaab* is what Indian merchants call settling accounts.

- **Who it's for:** small B2B merchants who sell on credit (distributors, wholesalers, suppliers) and have no accountant. Our persona is Aman, who runs his father's pharma distribution business from his phone.
- **The problem:** money arrives through Razorpay QR, bank transfers, cash and cheques, and none of it says which bills it pays. So the real record of dues lives in a notebook and the owner's memory.
- **What the agent does:** brings all incoming money into one place, works out who paid and which bills it clears, flags short payments and bounced cheques, and asks Aman only about what it isn't sure of.
- **The outcome:** money that would have slipped away gets recovered: short payments questioned, overdue dues chased with correct numbers.
- **Track 2 fit:** a revenue-recovery agent that makes decisions (who paid, which bills, is this deduction valid), which the merchant approves. It fills the gap between Razorpay's settlement recon and its Collections Agent.

**This submission** builds one core loop: money comes in, the agent works out who paid and which bills it clears, flags the short payment, and Aman confirms in one tap. Everything else is shown lightly or named as a next step.

## Problem

B2B merchants who sell on credit can't trust what their customers owe them, because money arrives through disconnected channels and nobody has time to match it to bills.

Customers pay partially, combine several bills, deduct for returns, and pay from personal accounts. Billing software can record payments, but it assumes an accountant does the work. Most small merchants don't have one, so dues live in a notebook, rebuilt every morning.

**Pain points (from interviews with a Lucknow pharma distributor and his father)**

| # | Pain point | Evidence |
| --- | --- | --- |
| 1 | Payments don't say which bills they pay | Partial, multi-bill and short payments are worked out by hand |
| 2 | Money arrives through disconnected channels | "Paytm ka alag, Reckon ka alag, and they are not synced" |
| 3 | Recording payments is too tedious, so nobody does it | Father stopped "because it's very tedious"; "an accountant used to do it" |
| 4 | The real ledger is a notebook and memory | "Have to remember a lot… have to write a lot… every morning" |

**What this costs the business**

- Short payments go unchecked: deductions are accepted without verifying returns.
- Overdue dues go unchased: nobody has a reliable view of who's late.
- Credit goes to customers who already owe.
- Customers who've already paid get chased by mistake.

**Where Razorpay's role ends today**

Razorpay collects the payment, records the amount, time and payer's UPI ID, and settles the money to the bank. Its role ends at "money received": it doesn't know which bills a payment was for, and never sees cash, cheques or direct bank transfers.

- **Ray's reconciliation** matches bank statements to Razorpay settlements and filters out direct customer payments (FTX'26 keynote, 27:07).
- **The Collections Agent** chases unpaid invoices it reads from internal systems (FTX'26 keynote, 1:00:15). For merchants without an accountant, those records are never updated, so it would chase customers who already paid.

The step in between, working out what each customer actually still owes, belongs to nobody.

## Persona and story

**Aman, 26, runs his father's pharma distribution business in Lucknow.** He sells to about 70 chemist shops on credit. The accountant left years ago; his father knows the billing software but gave up on it as "too tedious"; Aman was never trained. He works from his phone. About 70% of his money comes through the Razorpay QR and bank transfers, 30% in cash.

**A day today**

1. **11 AM.** Sharma Medicals pays ₹12,000 on the Razorpay QR. The soundbox confirms it, but Aman doesn't know which of Sharma's three bills it covers, or whether ₹400 was deducted for returned stock.
2. **2 PM.** Verma pays ₹8,000 in cash. Aman writes "Verma 8000" on a scrap of paper.
3. **5 PM.** ₹15,000 arrives by NEFT from "RAJESH K". He thinks it's Gupta Pharmacy's owner, but isn't sure.
4. **Next morning.** He sits with the notebook, the Razorpay app, the bank app and the paper scraps, rebuilding who paid what. Nothing goes into the billing software.
5. **Two weeks later.** A retailer complains about being asked for ₹6,000 he already paid. The payment was never written down.

Meanwhile, the ₹400 deduction was never checked, a retailer 45 days overdue looked settled, and fresh stock went on credit to a shop that already owed ₹30,000.

**The same day with Hisaab Agent**

1. **11 AM.** The agent matches Sharma's ₹12,000: two bills cleared, ₹2,000 paid on the third, and "₹400 short, looks like an expiry deduction, check it?"
2. **2 PM.** Aman sends a voice note: "Verma ne 8000 cash diye." It's matched to Verma's bills the same way.
3. **5 PM.** The bank transfer from "RAJESH K" arrives. The agent suggests Gupta Pharmacy; Aman confirms with one tap, and it remembers.
4. **Next morning.** No notebook. A short list waits: two matches to confirm, one deduction to check, one retailer 45 days overdue. Two minutes.
5. **Recovery.** The deduction is questioned, the overdue retailer is handed to the Collections Agent with correct numbers, and Aman sees who already owes him before giving more credit.

## Goals and non-goals

**Goals**

1. Give the merchant an accurate, up-to-date view of what each customer owes, across every way money comes in.
2. Remove the daily notebook: no manual matching, no reliance on memory.
3. Recover money that slips away today: short payments and overdue dues.
4. Keep the merchant's effort to a few minutes a day, spent only on decisions the agent can't make alone.

**Non-goals (deliberately not built)**

| Not built | Why |
| --- | --- |
| Chasing customers (calls, reminders to retailers) | Razorpay's Collections Agent already does this; Hisaab Agent feeds it correct data |
| Settlement speed | Already solved by Instant Settlement |
| Paying suppliers, tracking cheques the merchant issues | Money going out is a different problem; RazorpayX partly covers it |
| Replacing the billing software | Too large; merchants rely on it for stock, GST and licences |
| Credit-limit decisions | A natural next step once dues are reliable |

## How it works

&#91;embedded content: How Hisaab Agent works · 4 inputs, 1 decision point\]

Clear payments are recorded on their own; only uncertain ones reach Aman, and his corrections teach the agent for next time.

## MVP scope for this submission

The submission builds one loop end to end: money in → who paid → which bills → flag the short payment → Aman confirms. It's the loop where the AI decides and money is recovered.

| Tier | Features | In this submission |
| --- | --- | --- |
| Core | F3 Who paid · F4 Which bills · F5 Deduction flags · F7 Daily decision list | Built and demoed |
| Light | F1 Bill import (simple upload) · F2 Channels (Razorpay QR, one bank statement, one cash voice note) · F8 Dues view (one customer) | Shown simply, to make the story real |
| Later | F6 Cheques · F9 Hand-offs (Collections Agent, billing sync) · AI cleaning of bill files · automatic bank fetching | Named as next steps |

**Why this cut:** the core covers every Track 2 requirement: the signal, why AI, the action, merchant approval, learning, and rupees recovered. Cheques add a second workflow without showing anything new about the AI. Cash stays, lightly, because the notebook only disappears if cash is captured.

**Demo moments (90 seconds)**

| Time | Moment | What it proves |
| --- | --- | --- |
| 0–15s | Problem: Aman's notebook, three apps, "who owes what?" | The pain |
| 15–30s | Cash voice note: "Verma ne 8000 cash diye" is matched to two bills, ₹2,000 left pending (transcription shown on screen) | Messy input, allocation, the notebook disappearing |
| 30–45s | "RAJESH K" from the bank statement is suggested as Gupta Pharmacy; Aman confirms, and it's remembered | Payer identification, learning |
| 45–65s | ₹14,600 against ₹15,000 is flagged as a ₹400 deduction: "Question it" | Recovery |
| 65–80s | Morning decision list cleared in two minutes; one retailer 45 days overdue | Recovery, two minutes a day |
| 80–90s | Close: rupees recovered this month, notebook gone | The outcome |

Razorpay QR payments appear in the decision list and dues view without a moment of their own; their data is already clean, so they show less about the AI.

## Features

Nine features make up the full product, in the order money moves through them. Each heading says how it appears in this submission: MVP (built), light (shown simply) or later (next step).

### F1. Bill import · light

**What it means:** the agent knows every open bill, without Aman typing them.

- **Two ways in:** a direct integration with the billing software (as Razorpay already has with Tally and BUSY), or a file upload of the billing software's export.
- **Day one:** Aman uploads his full outstanding (ageing) report, which becomes the opening balance. After that, only new bills.
- **AI cleans the file:** reads any export layout ("Party Name" or "Customer", "Bill No" or "Inv #"), removes duplicates by bill number, and separates bills already paid on the spot from bills on credit.
- **Credit notes and returns** from the billing software reduce what a customer owes.

### F2. Money from every channel · light

**What it means:** all incoming money lands in one place.

| Channel | How it comes in | Aman's effort |
| --- | --- | --- |
| Razorpay QR and payment links | Automatically, with payer UPI ID and name | None |
| Bank transfers (NEFT, RTGS, IMPS) | Bank statement: fetched with his consent (Connected Banking or Account Aggregator), or uploaded | None after setup |
| Personal bank QR | Same bank statement | None after setup |
| Cash | A voice note, chat message or quick entry: "Gupta 8000" | One line |
| Cheques received | A quick entry or a photo of the cheque | One line or one photo |

### F3. Who paid? (payer identification) · MVP

**What it means:** every payment is tied to the right customer.

- Known UPI IDs, bank names and accounts are matched automatically.
- Unknown payers get a **suggestion, not a question**: "RAJESH K: probably Gupta Pharmacy? Yes / Change."
- **Quick start:** in the first days, the agent asks about the most frequent unknown payers first, so most money is recognised within a week.
- Not every bank credit is a customer. The agent separates out Razorpay settlements (matched by bank reference number, so they're never counted twice), Aman's own cash deposits, interest, loans, supplier refunds and transfers between his own accounts.
- A new customer is **never created automatically**. Unknown money waits in an "Unidentified" list until Aman decides.

### F4. Which bills? (allocation) · MVP

**What it means:** each payment is applied to the right bills, and what's left stays visible.

- An exact match to one bill, or to a combination of bills, wins.
- Otherwise the oldest bills clear first, and any remainder stays open on the next bill (for example, ₹3,000 still pending).
- Bill numbers in bank remarks or WhatsApp messages ("for bills 245 and 251") are used when present.
- Each customer's habits are learned: some always skip a disputed bill, some pay specific bills.
- Overpayments and advances are kept as credit for the next bill.

### F5. Short-payment and deduction flags · MVP

**What it means:** money that quietly goes missing gets noticed. This is the core recovery feature.

- A payment slightly below the bills it seems to cover (₹14,600 against ₹15,000) is flagged as a likely deduction, not treated as a partial payment.
- Aman sees: "₹400 short from Sharma. Expiry return? Accept / Question it."
- Small known differences (rounding, an agreed early-payment discount) are handled separately from real deductions.

### F6. Cheque tracking (received) · later

**What it means:** a cheque only counts once it clears.

- **Received:** the bill shows "payment pending", not paid.
- **Post-dated:** "deposit on 12 Oct", with a reminder to Aman.
- **Cleared:** matched automatically to the credit in the bank statement by cheque number and amount; the bill clears.
- **Bounced:** the return entry reopens the bill, Aman is alerted, and any bank charge is noted.

### F7. Daily decision list · MVP

**What it means:** instead of a ledger to read, Aman gets a short list of things only he can decide.

- Matches the agent wasn't sure about
- Short payments to accept or question
- Unidentified money
- Bounced cheques and cheques due for deposit
- Customers who crossed their usual payment time

Clear cases are already done. The aim is two minutes a day.

### F8. Customer dues view · light

**What it means:** "How much does Sharma owe, and since when?" is answered in seconds, on his phone.

- Per customer: open bills, amount owed, how long overdue, recent payments, pending cheques.
- Every number links back to the payments and bills behind it.

### F9. Hand-offs to act · later

**What it means:** decisions turn into recovery.

- **Overdue customers:** sent to Razorpay's Collections Agent, now with correct amounts.
- **Questioned deductions:** a ready message to send the customer.
- **Reminders to Aman:** cash still owed by a customer, cheques to deposit.
- **Later:** sync matched payments back into the billing software, so the books stay current.

## Edge cases

The two that matter most are double counting (Razorpay settlements and cash deposits showing up again in the bank statement) and deductions, which are the recovery opportunity.

| Edge case | Example | How it's handled |
| --- | --- | --- |
| Razorpay settlement in the bank statement | A ₹50,000 "RAZORPAY" credit | Matched to Razorpay's own settlement record by bank reference (UTR) and skipped, so QR payments aren't counted twice |
| Own cash deposit | ₹45,000 "BY CASH" credit | Compared with recent cash entries; marked as his deposit, not new money |
| Non-customer credit | Interest, loan, supplier refund, own transfer | Recognised from the bank description or known suppliers; otherwise Aman picks "not a customer payment"; remembered next time |
| Short payment | ₹14,600 against ₹15,000 | Flagged as a likely deduction (F5) |
| Overpayment or advance | ₹10,000 when ₹8,000 is due | ₹2,000 kept as credit for the next bill |
| Payment before the bill | Retailer pays for an order not yet billed | Held as an advance until the bill arrives |
| One payer, two shops | Same owner runs two chemist shops | Payer linked to both; the agent uses open bill amounts to choose, or asks |
| One shop, several payers | Owner, son and shop account all pay | All linked to one customer |
| Wrong match | Aman confirmed the wrong customer | One-tap undo; the correction also updates what the agent learned |
| Rounding or agreed discount | ₹9,998 for ₹10,000, or 2% early-payment discount | Treated as settled, not flagged |
| Disputed bill | Retailer refuses to pay one bill | Marked disputed, so it isn't counted as plain overdue or sent for chasing |
| Duplicate bill upload | Same export uploaded twice | Removed by bill number |
| Cheque bounce | Return entry plus bank charge | Bill reopened, Aman alerted, charge noted |
| Two people using it | Father and son both confirm matches | Shared data, with a record of who confirmed what |

## Why AI, and how it learns

A fixed rule ("clear the oldest bill first") handles clean cases. Real B2B payments are messy, and that's where the agent earns its place.

| Task | Why a fixed rule fails | What the AI does |
| --- | --- | --- |
| Identify the payer | "RAJESH K" or "98xxxx@ybl" matches no customer name | Compares names, owners and past payments; suggests the likely customer |
| Spot deductions | ₹14,600 fits no combination of bills | Recognises "all bills minus ₹400" as a likely deduction, not a random partial |
| Read intent | A retailer skips a disputed bill | Learns each customer's paying habits |
| Read messy inputs | Bank remarks, WhatsApp messages, voice notes, cheque photos, any billing export layout | Extracts customer, amount and bill numbers |
| Classify bank credits | Interest, loans, deposits and refunds look like payments | Reads bank descriptions and compares with what's expected |

**How it learns.** Every confirmation or correction from Aman is kept for his business only:

- which UPI IDs, names and accounts belong to which customer
- each customer's usual way of paying and typical deductions
- which recurring credits are not customer payments ("HDFC LOAN")

The data is small (a few hundred entries per merchant), so this is cheap to keep. The questions are front-loaded: many in week one, few after.

## Merchant control, trust and failure handling

The agent never moves money; it only records. Every decision can be undone, which lets it automate more than a payment agent safely could.

**What Aman can review, change, approve or stop**

| Action | Agent does alone | Needs Aman |
| --- | --- | --- |
| Exact, high-confidence match to a known customer | Yes | No, but he can undo it |
| Uncertain match or new payer | Suggests | Confirms or corrects |
| Short payment or deduction | Flags | Accepts or questions |
| Creating a new customer | Never | Always |
| Changing a customer's dues from unidentified money | Never | Always |
| Handing a customer to the Collections Agent | Suggests | Approves |
| Turning the agent off for a customer or channel | No | Any time |

This follows Razorpay's own model for agents: review-first, approval before consequential actions, and every action logged.

**Trust**

- Every match shows its reasoning: "Matched to Gupta Pharmacy: same account as 3 earlier payments; clears bills 245 and 251 exactly."
- Every number in the dues view links to the payments and bills behind it.
- The data belongs to the merchant's account only.

**When it fails**

| Failure | Risk | Safeguard |
| --- | --- | --- |
| Wrong customer | Wrong dues, an angry retailer | Low confidence goes to Aman; one-tap undo; corrections are learned |
| Wrong bills | Wrong overdue amounts | Allocation shown with reasoning; editable |
| Missed duplicate (settlement or cash deposit counted twice) | Dues look lower than they are | Settlements matched by bank reference; deposits checked against cash entries |
| Bank statement not fetched | Missing payments | Status shown ("last updated 6 hours ago"); upload as fallback |
| Wrongly flagged deduction | Unnecessary dispute | Aman decides; nothing goes to a retailer without approval |

## Success metrics

The lead metric is rupees recovered: overdue dues collected plus short payments recovered.

| Type | Metric | Why it matters |
| --- | --- | --- |
| Lead | ₹ recovered per merchant per month (overdue collected + short payments recovered) | The Track 2 outcome: money that would have slipped away |
| Supporting | Overdue receivables, and average days a bill stays overdue | Standard B2B health measure; should fall |
| Supporting | Time to close each day's collections | Replaces the morning notebook; target a few minutes |
| Trust | Share of matches accepted without correction | Shows the agent is right; should rise as it learns |
| Trust | Share of incoming money matched automatically | Coverage of the agent's work |
| Guardrail | Customers chased for money they had already paid | Target zero |
| Guardrail | Duplicates counted (settlements, cash deposits) | Target zero |

For Razorpay, secondary signals: B2B merchant retention, Collections Agent recovery rate on Hisaab-fed data, and receivables data that could later support Razorpay Capital lending.

## Feasibility and fit within Razorpay

Most of the pieces exist in Razorpay today; the main dependency is getting bills from pharma billing software.

| Part | Feasible? | Notes |
| --- | --- | --- |
| Razorpay QR payment data | Today | Razorpay already records payer, amount, time |
| Bill upload (Excel or CSV) | Today | Standard file import, cleaned by AI |
| Billing software integration | Needs partnership | Exists for Tally and BUSY; not Reckon or Marg. PayU has partnered with Marg (Aug 2026) |
| Bank statement upload and reading | Today | Ray already reads uploaded statements (FTX'26 keynote, 25:20) |
| Automatic statement fetching | Depends | RazorpayX Connected Banking (partner banks) or Account Aggregator (Razorpay's use unconfirmed) |
| Settlement detection | Today | Razorpay knows each settlement's bank reference |
| Payer identification and allocation | Feasible | Rules for clear cases, AI for messy ones |
| Per-merchant memory | Easy | A few hundred entries per merchant |
| Cash by voice note | Feasible | Ray on WhatsApp already accepts voice notes and screenshots |
| Cheque photo reading | Feasible | Standard OCR |

**Where it sits among Razorpay's agents**

| Product | What it does | Relation to Hisaab Agent |
| --- | --- | --- |
| Ray (Agentic Dashboard) | Answers questions; reconciles bank statements to Razorpay settlements | Upstream: Hisaab reuses its statement reading, and handles the customer payments Ray filters out |
| Agent Studio | Marketplace of agents (cart recovery, disputes) and a no-code builder | A natural home: Hisaab could ship as a B2B agent there |
| RazorpayX Collections Agent | Chases unpaid invoices by call and SMS | Downstream: Hisaab gives it correct invoice status |

**Why a merchant can't build this in Agent Studio today:** no connector for Reckon or Marg, no access to cash or direct bank transfers, unclear memory between runs, no review flow for allocations, and a user who isn't comfortable with a builder.

**Why Razorpay should build it:** it makes its own Collections Agent work for B2B merchants without accountants, defends the pharma segment PayU is entering through Marg, and creates receivables data that could support lending.

## Assumptions, risks and prototype scope

**Assumptions (and how we'd validate them)**

| Assumption | How to validate |
| --- | --- |
| The merchant collects on Razorpay; his real provider (Paytm) offers a comparable experience | Interviews with Razorpay B2B merchants |
| Bills come from the billing software by export, later by integration | Test exports from Reckon, Marg, Tally |
| Partial payments and deductions are common in B2B distribution (e.g. pharma expiry returns) | Share of payments that match no bill combination, from real data |
| The pattern extends beyond pharma to other B2B distributors | Interviews in FMCG, electrical, hardware distribution |

**Risks**

| Risk | Mitigation |
| --- | --- |
| Low felt pain: the merchant says mismatches "never happened" | Lead with what he can't see: unchecked deductions and silent overdue dues, shown in rupees |
| Cash entry still needs effort, so the notebook survives | One-line voice or chat entry; the only manual step left |
| Bill integration depends on partners | File upload from day one; partnerships to scale |
| Wrong matches damage trust | Suggest-and-confirm for anything uncertain; undo; reasoning shown |
| Evidence from one business | Presented as deep evidence from one case, plus industry research |

**Prototype scope (build challenge)**

The prototype shows one merchant's day end to end, on synthetic data:

- [ ] Upload an outstanding-bills file (synthetic)
- [ ] Payments arrive: Razorpay QR payments, one bank statement, one cash voice note
- [ ] Cash voice note "Verma ne 8000 cash diye" matched to two bills, ₹2,000 left pending
- [ ] "RAJESH K" suggested as Gupta Pharmacy; Aman confirms; remembered next time
- [ ] ₹14,600 against ₹15,000 flagged as a ₹400 deduction
- [ ] Morning decision list, then one customer's dues view

Not in the prototype: cheques, the hand-off to the Collections Agent, AI cleaning of bill files, automatic bank fetching, live integrations and sync back to the billing software.
