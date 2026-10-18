export interface Asset {
  id: string;
  brandId: string;
  frameId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  version: number;
  parentAssetId?: string;
  tags: string[];
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  tags?: string[];
  frameId?: string;
}
