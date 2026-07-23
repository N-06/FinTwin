import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: unknown;
  profile?: unknown;
  metrics?: unknown;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.6-flash");

        const system = `You are FinTwin AI, a warm, precise personal-finance assistant.
You help users understand their financial situation and improve it.
Always give concrete, personalized advice in simple language. Use short paragraphs and bullet lists.
Currency is Indian Rupees (₹). Never invent numbers — use the user's snapshot below when relevant.

USER FINANCIAL SNAPSHOT (JSON):
${JSON.stringify(body.profile ?? {}, null, 2)}

COMPUTED METRICS:
${JSON.stringify(body.metrics ?? {}, null, 2)}

When the user describes a financial decision (e.g. "should I buy a car?"), evaluate it against these numbers:
- impact on cashflow, debt-to-income, savings rate, emergency fund, goals
- flag risks and suggest safer alternatives
- end with a short "Bottom line:" recommendation.`;

        try {
          const result = streamText({
            model,
            system,
            messages: convertToModelMessages(body.messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (err) {
          console.error("chat error", err);
          return new Response("AI error", { status: 500 });
        }
      },
    },
  },
});
