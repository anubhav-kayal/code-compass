import mongoose, { Schema, Document } from "mongoose";

export interface IChunk extends Document {
  repoId: mongoose.Types.ObjectId;
  filePath: string;
  language: string;
  chunkType: "function" | "class" | "block" | "module" | "comment";
  symbolName?: string;
  startLine: number;
  endLine: number;
  content: string;
  embedding: number[];
  metadata: {
    imports: string[];
    exports: string[];
    classes: string[];
    functions: string[];
    dependencies: string[];
  };
}

const ChunkSchema = new Schema<IChunk>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: "Repo", required: true, index: true },
    filePath: { type: String, required: true },
    language: { type: String, required: true },
    chunkType: {
      type: String,
      enum: ["function", "class", "block", "module", "comment"],
      required: true,
    },
    symbolName: { type: String },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: [{ type: Number }],
    metadata: {
      imports: [{ type: String }],
      exports: [{ type: String }],
      classes: [{ type: String }],
      functions: [{ type: String }],
      dependencies: [{ type: String }],
    },
  },
  { timestamps: true }
);

ChunkSchema.index({ repoId: 1, filePath: 1 });
ChunkSchema.index({ repoId: 1, chunkType: 1 });
ChunkSchema.index({ repoId: 1, symbolName: 1 });

export const Chunk = mongoose.model<IChunk>("Chunk", ChunkSchema);
