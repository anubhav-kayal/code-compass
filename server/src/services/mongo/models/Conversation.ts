import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  sources: {
    chunkId: mongoose.Types.ObjectId;
    filePath: string;
    relevance: number;
  }[];
  graphContext?: Record<string, unknown>;
  timestamp: Date;
}

export interface IConversation extends Document {
  repoId: mongoose.Types.ObjectId;
  messages: IMessage[];
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  sources: [
    {
      chunkId: { type: Schema.Types.ObjectId, ref: "Chunk" },
      filePath: String,
      relevance: Number,
    },
  ],
  graphContext: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema<IConversation>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: "Repo", required: true, index: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
