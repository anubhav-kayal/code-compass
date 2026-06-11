import mongoose, { Schema, Document } from "mongoose";

export interface IRepo extends Document {
  githubUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  languages: string[];
  totalFiles: number;
  totalChunks: number;
  lastIndexedAt: Date | null;
  status: "pending" | "indexing" | "ready" | "failed";
  error?: string;
}

const RepoSchema = new Schema<IRepo>(
  {
    githubUrl: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    defaultBranch: { type: String, default: "main" },
    languages: [{ type: String }],
    totalFiles: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    lastIndexedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "indexing", "ready", "failed"],
      default: "pending",
    },
    error: { type: String },
  },
  { timestamps: true }
);

export const Repo = mongoose.model<IRepo>("Repo", RepoSchema);
