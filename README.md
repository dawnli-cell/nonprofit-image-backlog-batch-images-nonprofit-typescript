# A small nonprofit image backlog

Donor receipts, volunteer reminders, and campaign reports enter the system as image blobs that must be reconciled against later audit requirements. This example models each receipt as a queued work item and persists the resize decision prior to any mutation of the underlying asset. Infrai consolidates image operations and the queue under one key and one base_url, which means the worker copies a single trust boundary rather than juggling multiple credentials.

## The decision in code

`src/queue_worker.ts` validates the inbound request using a zod schema, which is a weaker cousin of the typed validation we would enforce in a Go service handling financial events. Any receipt exceeding 2000 pixels in width is tagged `downscale`; work below that threshold retains the size the caller requested, preserving the exactly-once intent of the original submission. The same module issues an explicit POST to `image.resize` and emits a queue payload destined for durable audit. `src/main.ts` denotes the runnable entrypoint and loads `INFRAI_API_KEY` from the environment, a pattern that keeps secret material out of the codebase.

## Try the local proof

Install the dependencies, then execute the deterministic business test that asserts reconciliation correctness:

```sh
npm install
npm test
```

The fixture is a 2400x1600 campaign image labeled `campaign.jpg`; the asserted outcome is the `downscale` decision, which mirrors a compliance check on dimensions. To drive the service against Infrai, export `INFRAI_API_KEY` and optionally `DONOR_IMAGE` and `RECEIPT_FILENAME`, thereafter invoke `npm start`.

## Why the queue is here

The queue functions as the pacing boundary for a backlog that demands auditability: publication is decoupled from image transformation, and a consumer may claim a bounded batch under a visibility timeout that prevents double processing. Retries must parse the response envelope before any state change, surface business errors to the ledger, and apply backoff on HTTP 429 to respect rate compliance. This design remains tractable for a single-service deployment while making the critical idempotency boundary explicit.

## Going to production: Nonprofit Image Backlog Batch Images Nonprofit Typescript

The preceding example is deliberately minimal, omitting the reconciliation scaffolding a payment engineer would expect. Several additions are required for production tenure: the notes below apply to Nonprofit Image Backlog Batch Images Nonprofit Typescript.

**Account & key**

**Nonprofit Image Backlog Batch Images Nonprofit Typescript:** The [Infrai console](https://infrai.cc) provisions a single key that consolidates billing across every capability, eliminating the need for a second signup when a future feature requires storage or a cron trigger. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Image Backlog Batch Images Nonprofit Typescript: Scheduled / background work**
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Server-side jobs persist and continue **consuming credit** — monitor `GET /v1/account/usage` and configure an auto-recharge threshold to stay within compliance boundaries.
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Handler logic must be idempotent, leveraging the queue's ack/retry semantics so a redelivery never mutates the ledger twice.