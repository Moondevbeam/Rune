# What is Rune? — Plain-language overview

This document explains Rune for anyone who is **not** a developer.  
Technical details live in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## The idea in one sentence

**Rune is a wallet that remembers who owes what — and helps you pay when it's time.**

---

## The problem

Crypto wallets are good at:

- Showing how much you own
- Sending money to an address

They are bad at:

- Remembering that *Marco still owes you €30 for lunch*
- Reminding you that *rent is due Friday*
- Keeping track of *four friends who haven't paid their share of dinner*

You end up using notes, WhatsApp, or spreadsheets — then manually copy amounts into a wallet when you finally pay.

---

## What Rune adds

Rune keeps a **list of payment commitments** on your phone:

| Field | Example |
|-------|---------|
| Title | “Dinner at Osteria” |
| Amount | 25 USDT |
| Direction | Luca **owes you** / you **owe** the landlord |
| Due date | Friday (optional) |
| Chain | Polygon (for when you pay) |

A commitment is **not** a smart contract. It does not force anyone to pay. It is a structured reminder — like a digital IOU — that connects to the wallet's send flow.

When you are ready to pay (or receive), you tap **Fulfill** and Rune opens Send with the right amount and network already filled in.

---

## Real-life examples

### Split a restaurant bill
You pay €120 for four people. You create a split in Rune. Each friend appears on your home screen as owing €30. When someone pays, you tap Fulfill and send USDT.

### Monthly rent
You set a recurring commitment: “Rent — €800 — 1st of month”. Each month it shows as due on Home. You fulfill when you pay the landlord.

### Gift with a link
You create a gift envelope for someone's birthday. They get a link to receive USDT before it expires.

### Family abroad
You owe your parents support every month. You track it as an outgoing commitment so you do not forget.

### Anything else
“Pay plumber”, “Return loan to Sara”, “Conference ticket for Alex” — custom commitments work for any promise.

---

## What Rune is NOT

| Rune is | Rune is not |
|---------|-------------|
| A self-custodial wallet (you hold your keys) | A bank or custodian |
| A personal payment tracker | A legal contract or escrow |
| A way to send USDT on multiple chains | An exchange or on-ramp |
| An open-source experiment (v0.1.x) | Audited, production-ready software |

**Do not put serious money in it yet.** The current release is a preview for testing and feedback.

---

## How the app is organized

```
Home          →  Your commitments + balance (start here)
Portfolio     →  What you own, per chain
Transactions  →  Past sends and receives
Tools         →  Split bill, gift, recurring, vault, contacts, …
Settings      →  PIN, theme, tutorial, show recovery phrase
```

**Typical flow:**

1. Open **Tools** (or **New** on Home) → create a commitment  
2. See it on **Home** when due or incoming  
3. Tap **Fulfill** → confirm with PIN → payment sent  

---

## Blockchains supported

Rune sends and receives **USDT** on:

- Ethereum
- Polygon
- BNB Chain
- TRON
- TON

You pick the network when creating a commitment or sending. Rune can suggest a cheaper rail for receiving (Smart Receive).

---

## Privacy & data

- Your recovery phrase and keys stay **on your device** (via Tether WDK secure storage).
- Commitments (splits, gifts, etc.) are stored **locally on your phone** — not on a Rune server.
- There is no Rune account or cloud sync in this version.

---

## Current status

| Version | Stage |
|---------|-------|
| v0.1.x | Pre-release preview APK on GitHub |
| Security | Not professionally audited |
| Audience | Testers, contributors, curious developers |

Feedback and bug reports are welcome on GitHub.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Commitment** | A tracked payment promise (who, how much, when) |
| **Fulfill** | Pay (or complete) a commitment via the Send screen |
| **Incoming** | Someone owes you |
| **Outgoing** | You owe someone |
| **Due** | Past the due date — needs attention |
| **Self-custodial** | You control your keys; no company holds your funds |
| **USDT** | Stablecoin pegged to the US dollar |
| **Recovery phrase** | 12 words that restore your wallet — keep offline and private |
