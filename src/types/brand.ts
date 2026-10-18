export type SectionId = string;

export interface BrandListItem {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSection {
  kind: "document";
  id: SectionId;
  label: string;
  icon: string;
  content: string;
  updatedAt: string;
}

export interface ListSection {
  kind: "list";
  id: SectionId;
  label: string;
  icon: string;
  items: BrandListItem[];
  updatedAt: string;
}

export type BrandSection = DocumentSection | ListSection;

export interface BrandKit {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  sections: BrandSection[];
  referenceUrls?: string[];
}
