import mongoose, { Schema, Document } from "mongoose";

export interface IIndexJob extends Document {
  repoId: mongoose.Types.ObjectId;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stages: {
    clone: string;
    parse: string;
    chunk: string;
    embed: string;
    graph: string;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const IndexJobSchema = new Schema<IIndexJob>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: "Repo", required: true, index: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    progress: { type: Number, default: 0 },
    stages: {
      clone: { type: String, default: "pending" },
      parse: { type: String, default: "pending" },
      chunk: { type: String, default: "pending" },
      embed: { type: String, default: "pending" },
      graph: { type: String, default: "pending" },
    },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const IndexJob = mongoose.model<IIndexJob>("IndexJob", IndexJobSchema);
