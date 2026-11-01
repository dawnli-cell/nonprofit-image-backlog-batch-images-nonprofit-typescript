import assert from "node:assert/strict";
import { planReceipt } from "./queue_worker.ts";

const decision = planReceipt({ image: "data:image/jpeg;base64,x", filename: "campaign.jpg", width: 2400, height: 1600 });
assert.equal(decision.decision, "downscale");
assert.equal(decision.filename, "campaign.jpg");
console.log("queue decision test passed");
