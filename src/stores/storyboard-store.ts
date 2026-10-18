import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  Storyboard,
  StoryboardItem,
  ItemStatus,
  Frame,
  CreateFrameInput,
} from "@/types/storyboard";
import type { FrameStatus } from "@/types/common";
import {
  fetchStoryboardsByBrand,
  saveStoryboard,
  deleteStoryboard as deleteStoryboardDb,
} from "@/lib/db";
import {
  fetchFramesByStoryboard,
  saveFrame,
  deleteFrameDb,
} from "@/lib/db/frames";

interface StoryboardState {
  storyboards: Storyboard[];
  activeStoryboardId: string | null;
  loadedBrandId: string | null;

  // ─── Frames (relational, replaces legacy items) ──────────────
  frames: Frame[];
  activeFrameId: string | null;
  loadedStoryboardId: string | null;

  // ─── Legacy items (kept for backward compat) ─────────────────
  activeItemId: string | null;

  // Generation state (shared by items and frames)
  generatingItemId: string | null;
  streamOutput: string;

  // DB sync
  loadStoryboards: (brandId: string) => Promise<void>;

  // Storyboard CRUD
  createStoryboard: (
    brandId: string,
    name: string,
    description?: string,
    campaignId?: string
  ) => void;
  updateStoryboard: (
    id: string,
    updates: Partial<Pick<Storyboard, "name" | "description" | "status">>
  ) => void;
  deleteStoryboard: (id: string) => void;
  setActiveStoryboard: (id: string | null) => void;

  // ─── Frame CRUD ──────────────────────────────────────────────
  loadFrames: (storyboardId: string) => Promise<void>;
  addFrame: (input: CreateFrameInput) => void;
  updateFrame: (frameId: string, updates: Partial<Frame>) => void;
  removeFrame: (frameId: string) => void;
  setActiveFrame: (id: string | null) => void;
  updateFrameStatus: (frameId: string, status: FrameStatus) => void;
  saveFrameGeneratedContent: (
    frameId: string,
    content: string,
    prompt: string
  ) => void;
  getActiveFrame: () => Frame | undefined;
  moveFrameUp: (frameId: string) => void;
  moveFrameDown: (frameId: string) => void;

  // ─── Legacy Item CRUD (kept working) ─────────────────────────
  addItem: (
    item: Pick<
      StoryboardItem,
      "contentType" | "platform" | "title" | "brief"
    >
  ) => void;
  updateItem: (
    itemId: string,
    updates: Partial<
      Pick<StoryboardItem, "title" | "brief" | "contentType" | "platform">
    >
  ) => void;
  removeItem: (itemId: string) => void;
  setActiveItem: (id: string | null) => void;
  updateItemStatus: (itemId: string, status: ItemStatus) => void;

  // Generation
  setGeneratingItem: (itemId: string | null) => void;
  appendStreamOutput: (content: string) => void;
  clearStreamOutput: () => void;
  saveGeneratedContent: (
    itemId: string,
    content: string,
    prompt: string
  ) => void;

  // Helpers
  getActiveStoryboard: () => Storyboard | undefined;
}

function findStoryboard(state: StoryboardState): Storyboard | undefined {
  return state.storyboards.find((s) => s.id === state.activeStoryboardId);
}

function syncStoryboard(get: () => StoryboardState, id?: string) {
  const sb =
    get().storyboards.find((s) => s.id === (id ?? get().activeStoryboardId));
  if (sb) {
    saveStoryboard(sb).catch(console.error);
  }
}

function syncFrame(get: () => StoryboardState, frameId: string) {
  const frame = get().frames.find((f) => f.id === frameId);
  if (frame) {
    saveFrame(frame).catch(console.error);
  }
}

export const useStoryboardStore = create<StoryboardState>()(
  immer((set, get) => ({
    storyboards: [],
    activeStoryboardId: null,
    activeItemId: null,
    loadedBrandId: null,

    // Frame state
    frames: [],
    activeFrameId: null,
    loadedStoryboardId: null,

    // Generation state
    generatingItemId: null,
    streamOutput: "",

    // ─── Storyboard loading ──────────────────────────────────────

    loadStoryboards: async (brandId) => {
      if (get().loadedBrandId === brandId && get().storyboards.length > 0) {
        return;
      }
      try {
        const boards = await fetchStoryboardsByBrand(brandId);
        set((state) => {
          state.storyboards = boards;
          state.loadedBrandId = brandId;
          if (
            state.activeStoryboardId &&
            !boards.find((b) => b.id === state.activeStoryboardId)
          ) {
            state.activeStoryboardId = null;
            state.activeItemId = null;
            state.activeFrameId = null;
            state.frames = [];
            state.loadedStoryboardId = null;
          }
        });
      } catch (err) {
        console.error("Failed to load storyboards:", err);
      }
    },

    // ─── Storyboard CRUD ─────────────────────────────────────────

    createStoryboard: (brandId, name, description = "", campaignId) => {
      const now = new Date().toISOString();
      const sb: Storyboard = {
        id: nanoid(),
        brandId,
        campaignId,
        name,
        description,
        status: "draft",
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        state.storyboards.push(sb);
        state.activeStoryboardId = sb.id;
        state.activeItemId = null;
        state.activeFrameId = null;
        state.frames = [];
        state.loadedStoryboardId = null;
      });
      saveStoryboard(sb).catch(console.error);
    },

    updateStoryboard: (id, updates) => {
      set((state) => {
        const sb = state.storyboards.find((s) => s.id === id);
        if (!sb) return;
        Object.assign(sb, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      syncStoryboard(get, id);
    },

    deleteStoryboard: (id) => {
      set((state) => {
        state.storyboards = state.storyboards.filter((s) => s.id !== id);
        if (state.activeStoryboardId === id) {
          state.activeStoryboardId = state.storyboards[0]?.id ?? null;
          state.activeItemId = null;
          state.activeFrameId = null;
          state.frames = [];
          state.loadedStoryboardId = null;
        }
      });
      deleteStoryboardDb(id).catch(console.error);
    },

    setActiveStoryboard: (id) => {
      set((state) => {
        state.activeStoryboardId = id;
        state.activeItemId = null;
        state.activeFrameId = null;
        // Clear frames when switching storyboards (will be reloaded)
        if (state.loadedStoryboardId !== id) {
          state.frames = [];
          state.loadedStoryboardId = null;
        }
      });
    },

    // ─── Frame CRUD ──────────────────────────────────────────────

    loadFrames: async (storyboardId) => {
      if (
        get().loadedStoryboardId === storyboardId &&
        get().frames.length > 0
      ) {
        return;
      }
      try {
        const rows = await fetchFramesByStoryboard(storyboardId);
        set((state) => {
          state.frames = rows;
          state.loadedStoryboardId = storyboardId;
          if (
            state.activeFrameId &&
            !rows.find((f) => f.id === state.activeFrameId)
          ) {
            state.activeFrameId = null;
          }
        });
      } catch (err) {
        console.error("Failed to load frames:", err);
      }
    },

    addFrame: (input) => {
      const sb = get().getActiveStoryboard();
      if (!sb) return;

      const now = new Date().toISOString();
      const frame: Frame = {
        id: nanoid(),
        storyboardId: sb.id,
        brandId: sb.brandId,
        campaignId: sb.campaignId,
        title: input.title,
        contentType: input.contentType,
        platform: input.platform,
        status: "planned",
        sortOrder: get().frames.length,
        data: {
          brief: input.brief ?? "",
        },
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        state.frames.push(frame);
        state.activeFrameId = frame.id;
      });
      saveFrame(frame).catch(console.error);
    },

    updateFrame: (frameId, updates) => {
      set((state) => {
        const frame = state.frames.find((f) => f.id === frameId);
        if (!frame) return;
        Object.assign(frame, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      syncFrame(get, frameId);
    },

    removeFrame: (frameId) => {
      set((state) => {
        state.frames = state.frames.filter((f) => f.id !== frameId);
        if (state.activeFrameId === frameId) {
          state.activeFrameId = null;
        }
      });
      deleteFrameDb(frameId).catch(console.error);
    },

    setActiveFrame: (id) => {
      set((state) => {
        state.activeFrameId = id;
      });
    },

    updateFrameStatus: (frameId, status) => {
      set((state) => {
        const frame = state.frames.find((f) => f.id === frameId);
        if (!frame) return;
        frame.status = status;
        frame.updatedAt = new Date().toISOString();
      });
      syncFrame(get, frameId);
    },

    saveFrameGeneratedContent: (frameId, content, prompt) => {
      set((state) => {
        const frame = state.frames.find((f) => f.id === frameId);
        if (!frame) return;
        frame.data.generatedContent = content;
        frame.data.promptUsed = prompt;
        frame.status = "in_production";
        frame.updatedAt = new Date().toISOString();
      });
      syncFrame(get, frameId);
    },

    getActiveFrame: () => {
      const s = get();
      return s.frames.find((f) => f.id === s.activeFrameId);
    },

    moveFrameUp: (frameId) => {
      const frame = get().frames.find((f) => f.id === frameId);
      if (!frame) return;
      const siblings = get()
        .frames.filter((f) => f.storyboardId === frame.storyboardId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = siblings.findIndex((f) => f.id === frameId);
      if (idx <= 0) return;
      const above = siblings[idx - 1];
      const currentOrder = frame.sortOrder;
      const aboveOrder = above.sortOrder;
      set((state) => {
        const f = state.frames.find((fr) => fr.id === frameId)!;
        const a = state.frames.find((fr) => fr.id === above.id)!;
        f.sortOrder = aboveOrder;
        a.sortOrder = currentOrder;
        f.updatedAt = new Date().toISOString();
        a.updatedAt = new Date().toISOString();
      });
      syncFrame(get, frameId);
      syncFrame(get, above.id);
    },

    moveFrameDown: (frameId) => {
      const frame = get().frames.find((f) => f.id === frameId);
      if (!frame) return;
      const siblings = get()
        .frames.filter((f) => f.storyboardId === frame.storyboardId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = siblings.findIndex((f) => f.id === frameId);
      if (idx < 0 || idx >= siblings.length - 1) return;
      const below = siblings[idx + 1];
      const currentOrder = frame.sortOrder;
      const belowOrder = below.sortOrder;
      set((state) => {
        const f = state.frames.find((fr) => fr.id === frameId)!;
        const b = state.frames.find((fr) => fr.id === below.id)!;
        f.sortOrder = belowOrder;
        b.sortOrder = currentOrder;
        f.updatedAt = new Date().toISOString();
        b.updatedAt = new Date().toISOString();
      });
      syncFrame(get, frameId);
      syncFrame(get, below.id);
    },

    // ─── Legacy Item CRUD (kept for backward compat) ─────────────

    addItem: (item) => {
      set((state) => {
        const sb = findStoryboard(state);
        if (!sb) return;
        const now = new Date().toISOString();
        sb.items.push({
          id: nanoid(),
          contentType: item.contentType,
          platform: item.platform,
          title: item.title,
          brief: item.brief,
          status: "draft",
          generatedContent: "",
          promptUsed: "",
          createdAt: now,
          updatedAt: now,
        });
        sb.updatedAt = now;
      });
      syncStoryboard(get);
    },

    updateItem: (itemId, updates) => {
      set((state) => {
        const sb = findStoryboard(state);
        if (!sb) return;
        const item = sb.items.find((i) => i.id === itemId);
        if (!item) return;
        if (updates.title !== undefined) item.title = updates.title;
        if (updates.brief !== undefined) item.brief = updates.brief;
        if (updates.contentType !== undefined)
          item.contentType = updates.contentType;
        if (updates.platform !== undefined) item.platform = updates.platform;
        const now = new Date().toISOString();
        item.updatedAt = now;
        sb.updatedAt = now;
      });
      syncStoryboard(get);
    },

    removeItem: (itemId) => {
      set((state) => {
        const sb = findStoryboard(state);
        if (!sb) return;
        sb.items = sb.items.filter((i) => i.id !== itemId);
        sb.updatedAt = new Date().toISOString();
        if (state.activeItemId === itemId) {
          state.activeItemId = null;
        }
      });
      syncStoryboard(get);
    },

    setActiveItem: (id) => {
      set((state) => {
        state.activeItemId = id;
      });
    },

    updateItemStatus: (itemId, status) => {
      set((state) => {
        const sb = findStoryboard(state);
        if (!sb) return;
        const item = sb.items.find((i) => i.id === itemId);
        if (!item) return;
        item.status = status;
        const now = new Date().toISOString();
        item.updatedAt = now;
        sb.updatedAt = now;
      });
      syncStoryboard(get);
    },

    // ─── Generation (shared) ─────────────────────────────────────

    setGeneratingItem: (itemId) => {
      set((state) => {
        state.generatingItemId = itemId;
      });
    },

    appendStreamOutput: (content) => {
      set((state) => {
        state.streamOutput += content;
      });
    },

    clearStreamOutput: () => {
      set((state) => {
        state.streamOutput = "";
      });
    },

    saveGeneratedContent: (itemId, content, prompt) => {
      set((state) => {
        const sb = findStoryboard(state);
        if (!sb) return;
        const item = sb.items.find((i) => i.id === itemId);
        if (!item) return;
        item.generatedContent = content;
        item.promptUsed = prompt;
        item.status = "generated";
        const now = new Date().toISOString();
        item.updatedAt = now;
        sb.updatedAt = now;
      });
      syncStoryboard(get);
    },

    // ─── Helpers ─────────────────────────────────────────────────

    getActiveStoryboard: () => {
      const s = get();
      return s.storyboards.find((sb) => sb.id === s.activeStoryboardId);
    },
  }))
);
