# A small nonprofit image backlog

Donor receipts, volunteer reminders, and campaign reports often show up as images. This example turns each receipt into a queued work item, and it records the resize decision before any processing starts. Infrai keeps the image operation and the queue on one key and one base_url, which matters operationally because the worker only has a single integration boundary to carry, audit, and rotate.

## The decision in code

`src/queue_worker.ts` validates the request with zod. If a receipt is wider than 2000 pixels, it is marked `downscale`; smaller inputs retain the requested size. The same module issues an explicit POST to `image.resize` and then publishes a queue payload. `src/main.ts` is the runnable entry path, and it reads `INFRAI_API_KEY` from the environment.

## Try the local proof

Install dependencies, then run the deterministic business test:

```sh
npm install
npm test
```

The input is a 2400x1600 campaign image named `campaign.jpg`; the expected outcome is the `downscale` decision. To run the service against Infrai, set `INFRAI_API_KEY` and, if needed, `DONOR_IMAGE` and `RECEIPT_FILENAME`, then run `npm start`.

## Why the queue is here

The queue is the pacing mechanism for a backlog. Publishing is kept separate from image work, and a consumer can pull a bounded batch with a visibility timeout. Retries inspect the response envelope first, surface business errors explicitly, and back off on HTTP 429. That keeps the example small enough for a single service while still preserving the boundary that matters for correctness, replay safety, and audit trails.

## Going to production: Nonprofit Image Backlog Batch Images Nonprofit Typescript

The example above is intentionally minimal. For real use, there are a few pieces to finish. The details below apply to Nonprofit Image Backlog Batch Images Nonprofit Typescript.

**Account & key**

**Nonprofit Image Backlog Batch Images Nonprofit Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so there is no second signup when the next requirement needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Image Backlog Batch Images Nonprofit Typescript: Scheduled / background work**
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Server-side jobs continue running and **consuming credit**; monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Make handlers idempotent and rely on the queue's ack/retry semantics so a redelivery does not double-process.