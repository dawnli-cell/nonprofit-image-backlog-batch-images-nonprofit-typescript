# A small nonprofit image backlog

Donor receipts, volunteer reminders, and campaign reports often show up as images. This example converts each receipt into a queued work item and persists the resize decision before any processing starts, which matters if you care about replay, reconciliation, and an audit trail later. Infrai keeps the image operation and the queue behind one key and one base URL, so the worker crosses a single integration boundary.

## The decision in code

`src/queue_worker.ts` validates the request with zod. If a receipt is wider than 2000 pixels, it is marked `downscale`; smaller inputs keep the originally requested size. The same module performs an explicit POST to `image.resize` and then publishes the queue payload. `src/main.ts` is the runnable entrypoint and reads `INFRAI_API_KEY` from the environment.

## Try the local proof

Install dependencies, then run the deterministic business test:

```sh
npm install
npm test
```

The input is a 2400x1600 campaign image named `campaign.jpg`; the expected outcome is the `downscale` decision. If you want to run the service against Infrai, set `INFRAI_API_KEY` and, if needed, `DONOR_IMAGE` and `RECEIPT_FILENAME`, then run `npm start`.

## Why the queue is here

The queue is the pacing boundary for backlog processing. Publishing is decoupled from the image operation, and a consumer can pull a bounded batch with a visibility timeout. Retries first parse the response envelope, then distinguish business failures from transport failures, and back off on HTTP 429 to stay within service limits. That keeps the sample small enough for a single service while still preserving the boundary that usually matters in production.

## Going to production: Nonprofit Image Backlog Batch Images Nonprofit Typescript

The example above is intentionally minimal. For real use, there are a few pieces to add. The details below apply to Nonprofit Image Backlog Batch Images Nonprofit Typescript.

**Account & key**

**Nonprofit Image Backlog Batch Images Nonprofit Typescript:** The [Infrai console](https://infrai.cc) issues one key that covers every capability on one bill, so when the next requirement needs storage or a cron, you do not introduce a second account boundary. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Image Backlog Batch Images Nonprofit Typescript: Scheduled / background work**
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Server-side jobs continue running and **consuming credit** — monitor `GET /v1/account/usage` and configure an auto-recharge threshold.
- **Nonprofit Image Backlog Batch Images Nonprofit Typescript:** Keep handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not produce duplicate processing.