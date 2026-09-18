import { Request, Response } from "express";
import mongoose from "mongoose";
import { Conversation, Chunk } from "../../services/mongo";
import { buildChatPrompt, chatCompletion } from "../../services/llm";
import { hybridRetrieve, keywordSearch } from "../../services/rag";
import { getFunctionContext, getArchitectureSummary } from "../../services/rag";
import { mergeResults } from "../../services/rag";
import { AppError } from "../middleware/errorHandler";

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { repoId, conversationId, message } = req.body;

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError(404, "Conversation not found");
  } else {
    conversation = new Conversation({ repoId, messages: [] });
  }

  conversation.messages.push({
    role: "user",
    content: message,
    sources: [],
    timestamp: new Date(),
  });

  const semanticResults = await hybridRetrieve({ repoId, query: message });
  const keywordResults = await keywordSearch(repoId, message);
  const mergedResults = mergeResults(semanticResults, keywordResults);

  const codeContext = mergedResults
    .slice(0, 5)
    .map((r) => `// ${r.filePath}:${r.startLine}-${r.endLine}\n${r.snippet}`)
    .join("\n\n---\n\n");

  // Prefer graph context anchored to a specific symbol — either named explicitly in the
  // question, or surfaced by retrieval — over dumping the whole-repo architecture summary,
  // which is usually irrelevant to the actual question and can be huge on large repos.
  let graphContext = "";
  try {
    const functionMatch = message.match(/(?:function|method|class)\s+['"]?(\w+)['"]?/i);
    const topSymbol = mergedResults.find((r) => r.symbolName)?.symbolName;
    const targetSymbol = functionMatch?.[1] || topSymbol;

    if (targetSymbol) {
      graphContext = await getFunctionContext({
        functionName: targetSymbol,
        repoId,
        direction: "both",
      });
    }

    if (!graphContext) {
      graphContext = await getArchitectureSummary(repoId);
    }
  } catch {
    graphContext = "Graph context unavailable";
  }

  const history = conversation.messages
    .slice(-10, -1)
    .map((m) => ({ role: m.role, content: m.content }));

  const prompt = buildChatPrompt(message, codeContext, graphContext, history);
  const response = await chatCompletion(prompt);

  conversation.messages.push({
    role: "assistant",
    content: response.content,
    sources: mergedResults.slice(0, 10).map((r) => ({
      chunkId: mongoose.Types.ObjectId.createFromHexString(r.chunkId),
      filePath: r.filePath,
      relevance: r.relevance,
    })),
    timestamp: new Date(),
  });

  await conversation.save();

  res.json({
    success: true,
    data: {
      conversationId: conversation._id,
      message: response.content,
      sources: mergedResults.slice(0, 10),
      usage: response.usage,
    },
  });
}

export async function listConversations(req: Request, res: Response): Promise<void> {
  const { repoId, page, limit } = req.query as unknown as { repoId?: string; page: number; limit: number };
  const filter = repoId ? { repoId: mongoose.Types.ObjectId.createFromHexString(repoId) } : {};

  const [conversations, total] = await Promise.all([
    Conversation.find(filter)
      .select("repoId messages createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Conversation.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: conversations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  const conversation = await Conversation.findById(req.params.id).lean();
  if (!conversation) throw new AppError(404, "Conversation not found");
  res.json({ success: true, data: conversation });
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  const conversation = await Conversation.findByIdAndDelete(req.params.id);
  if (!conversation) throw new AppError(404, "Conversation not found");
  res.json({ success: true, message: "Conversation deleted" });
}
