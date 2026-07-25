import { streamText, type UIMessage } from "ai";
import { createGroq } from "@ai-sdk/groq";

type ChatBody = {
  messages?: unknown;
  profile?: unknown;
  metrics?: unknown;
};

export async function handleChatPost(request: Request) {
  const body = (await request.json()) as ChatBody;
  if (!Array.isArray(body.messages)) {
    return new Response("Messages required", { status: 400 });
  }
  const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  const groq = createGroq({ apiKey: key });
  const model = groq("llama-3.1-8b-instant");

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
    // Manually extract text from UIMessage parts — avoids convertToModelMessages
    // format incompatibility between AI SDK v4 and the messages sent by useChat
    const modelMessages = (body.messages as UIMessage[]).map((m) => {
      const text = (m.parts ?? [])
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text as string)
        .join("") || "";
      return { role: m.role as "user" | "assistant", content: text };
    });

    console.log("[chat] model messages:", JSON.stringify(modelMessages).slice(0, 200));

    const result = streamText({
      model: model as any,
      system,
      messages: modelMessages,
      onError: (e: any) => {
        require("fs").writeFileSync("groq-error.txt", String(e.message || e) + "\n\n" + JSON.stringify(e));
      }
    });
    return result.toUIMessageStreamResponse({
      originalMessages: body.messages as UIMessage[],
    });
  } catch (err: any) {
    console.error("[chat] error:", err?.message ?? err);
    return new Response(`AI error: ${err?.message ?? "unknown"}`, { status: 500 });
  }
}
