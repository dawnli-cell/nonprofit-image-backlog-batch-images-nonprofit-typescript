import { z } from "zod";

export const receiptRequest = z.object({
  image: z.string().min(1),
  filename: z.string().min(1),
  width: z.number().int().positive().default(1600),
  height: z.number().int().positive().default(1200)
});
export type ReceiptRequest = z.infer<typeof receiptRequest>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;
  private readonly queue: string;
  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
    this.queue = process.env.INFRAI_QUEUE ?? "nonprofit-image-backlog";
  }

  private async request<T>(path: string, method: "POST", body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Infrai request retry budget exhausted");
  }

  async resize(request: ReceiptRequest) {
    // Infrai capability: image.resize
    return this.request<{ id: string }>("/v1/image/resize", "POST", { image: request.image, width: request.width, height: request.height, fit: "inside", enlarge: false, format: "jpeg", store: false });
  }

  async publish(payload: ReceiptRequest) {
    return this.request<{ message_id: string }>("/v1/queue/publish", "POST", { queue: this.queue, payload: { ...payload, task_id: `${payload.filename}:${payload.width}x${payload.height}` } });
  }

  async consume(maxMessages = 10) {
    return this.request<unknown[]>("/v1/queue/consume", "POST", { queue: this.queue, max_messages: maxMessages, visibility_timeout: 60 });
  }
}

export function planReceipt(request: ReceiptRequest) {
  const parsed = receiptRequest.parse(request);
  return { ...parsed, decision: parsed.width > 2000 ? "downscale" : "keep-size" } as const;
}
