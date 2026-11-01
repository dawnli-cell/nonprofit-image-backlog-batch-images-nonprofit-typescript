import { InfraiClient, planReceipt, receiptRequest } from "./queue_worker.ts";

const client = new InfraiClient();
const input = receiptRequest.parse({ image: process.env.DONOR_IMAGE ?? "data:image/jpeg;base64,placeholder", filename: process.env.RECEIPT_FILENAME ?? "donor-receipt.jpg" });
const plan = planReceipt(input);
const published = await client.publish(input);
const resized = await client.resize(input);
console.log(JSON.stringify({ workflow: "donor-receipt", decision: plan.decision, message_id: published.message_id, image_id: resized.id }));
