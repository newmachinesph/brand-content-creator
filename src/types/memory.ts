import type { MemoryType, MemorySource } from "./common";

export interface BrandMemory {
  id: string;
  brandId: string;
  type: MemoryType;
  source: MemorySource;
  title: string;
  content: string;
  tags: string[];
  importance: number;
  embedding?: number[];
  data: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  type: MemoryType;
  source?: MemorySource;
  title: string;
  content: string;
  tags?: string[];
  importance?: number;
}
