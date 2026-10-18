import { nanoid } from "nanoid";
import type {
  BrandKit,
  BrandSection,
  DocumentSection,
  ListSection,
} from "@/types/brand";

type SectionTemplate =
  | Omit<DocumentSection, "updatedAt">
  | Omit<ListSection, "updatedAt">;

const DEFAULT_SECTIONS: SectionTemplate[] = [
  {
    kind: "document",
    id: "brand-voice",
    label: "Brand Voice Document",
    icon: "IconMicrophone",
    content: "",
  },
  {
    kind: "document",
    id: "messaging-framework",
    label: "Messaging Framework",
    icon: "IconMessage",
    content: "",
  },
  {
    kind: "document",
    id: "style-guide",
    label: "Style Guide / Copy Rules",
    icon: "IconPencil",
    content: "",
  },
  {
    kind: "document",
    id: "visual-identity",
    label: "Visual Identity Specs",
    icon: "IconPalette",
    content: "",
  },
  {
    kind: "list",
    id: "target-audiences",
    label: "Target Audience Profiles",
    icon: "IconUsers",
    items: [],
  },
  {
    kind: "list",
    id: "content-examples",
    label: "Content Examples",
    icon: "IconStar",
    items: [],
  },
  {
    kind: "list",
    id: "anti-examples",
    label: "Anti-Examples",
    icon: "IconAlertTriangle",
    items: [],
  },
  {
    kind: "list",
    id: "products",
    label: "Product/Service Descriptions",
    icon: "IconPackage",
    items: [],
  },
];

export function createDefaultBrandKit(
  name: string,
  description: string = ""
): BrandKit {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    sections: DEFAULT_SECTIONS.map((s) => ({
      ...s,
      updatedAt: now,
    })) as BrandSection[],
  };
}
