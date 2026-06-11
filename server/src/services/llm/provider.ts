import { openai } from "../../config/llm";
import { config } from "../../config";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function chatCompletion(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number; stream?: boolean }
): Promise<LLMResponse> {
  const completion = await openai.chat.completions.create({
    model: config.llm.model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
    stream: false,
  });

  return {
    content: completion.choices[0]?.message?.content || "",
    usage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}

export async function* streamChatCompletion(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: config.llm.model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield content;
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: config.embedding.model,
    input: text,
  });

  return response.data[0]?.embedding || [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: config.embedding.model,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
