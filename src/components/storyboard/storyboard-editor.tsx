import { useState, useEffect, useMemo } from "react";
import { IconPlus, IconLayoutBoard, IconSpeakerphone, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useAppStore } from "@/stores/app-store";
import { FrameCard } from "@/components/storyboards/frame-card";
import { FrameForm } from "@/components/storyboards/frame-form";
import { FrameDetail } from "@/components/storyboards/frame-detail";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { Frame, CreateFrameInput } from "@/types/storyboard";

export function StoryboardEditor() {
  const storyboard = useStoryboardStore((s) => s.getActiveStoryboard());
  const rawFrames = useStoryboardStore((s) => s.frames);
  const activeFrameId = useStoryboardStore((s) => s.activeFrameId);
  const loadFrames = useStoryboardStore((s) => s.loadFrames);
  const addFrame = useStoryboardStore((s) => s.addFrame);
  const updateFrame = useStoryboardStore((s) => s.updateFrame);
  const removeFrame = useStoryboardStore((s) => s.removeFrame);
  const setActiveFrame = useStoryboardStore((s) => s.setActiveFrame);
  const moveFrameUp = useStoryboardStore((s) => s.moveFrameUp);
  const moveFrameDown = useStoryboardStore((s) => s.moveFrameDown);

  // Sort frames by sortOrder for display
  const frames = useMemo(
    () => [...rawFrames].sort((a, b) => a.sortOrder - b.sortOrder),
    [rawFrames],
  );
  const campaigns = useCampaignStore((s) => s.campaigns);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  const parentCampaign = storyboard?.campaignId
    ? campaigns.find((c) => c.id === storyboard.campaignId)
    : undefined;

  const [formOpen, setFormOpen] = useState(false);
  const [editFrame, setEditFrame] = useState<Frame | undefined>();
  const [deleteFrameId, setDeleteFrameId] = useState<string | null>(null);

  // Load frames when storyboard changes
  useEffect(() => {
    if (storyboard?.id) {
      loadFrames(storyboard.id);
    }
  }, [storyboard?.id, loadFrames]);

  if (!storyboard) return null;

  const activeFrame = frames.find((f) => f.id === activeFrameId);

  function handleAddFrame() {
    setEditFrame(undefined);
    setFormOpen(true);
  }

  function handleEditFrame(frame: Frame) {
    setEditFrame(frame);
    setFormOpen(true);
  }

  function handleFormSubmit(data: CreateFrameInput) {
    if (editFrame) {
      updateFrame(editFrame.id, {
        title: data.title,
        contentType: data.contentType,
        platform: data.platform,
        data: { ...editFrame.data, brief: data.brief },
      });
    } else {
      addFrame(data);
    }
  }

  function handleConfirmDelete() {
    if (deleteFrameId) {
      removeFrame(deleteFrameId);
      setDeleteFrameId(null);
    }
  }

  return (
    <div className="flex h-full">
      {/* Left: frames list */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border">
        {/* Campaign context badge */}
        {parentCampaign && (
          <button
            type="button"
            onClick={() => {
              setActiveCampaign(parentCampaign.id);
              setActiveModule("campaigns");
            }}
            className="group flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 text-left transition-colors hover:bg-primary/10"
          >
            <IconSpeakerphone className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-primary">
              {parentCampaign.name}
            </span>
            <IconArrowRight className="h-3 w-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            {frames.length} frame{frames.length !== 1 && "s"}
          </span>
          <Button size="sm" variant="ghost" onClick={handleAddFrame}>
            <IconPlus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-3">
            {frames.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No frames yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleAddFrame}
                >
                  <IconPlus className="mr-1.5 h-4 w-4" />
                  Add First Frame
                </Button>
              </div>
            ) : (
              frames.map((frame, idx) => (
                <FrameCard
                  key={frame.id}
                  frame={frame}
                  isActive={activeFrameId === frame.id}
                  onClick={() => setActiveFrame(frame.id)}
                  onEdit={() => handleEditFrame(frame)}
                  onDelete={() => setDeleteFrameId(frame.id)}
                  onMoveUp={
                    idx > 0
                      ? () => moveFrameUp(frame.id)
                      : undefined
                  }
                  onMoveDown={
                    idx < frames.length - 1
                      ? () => moveFrameDown(frame.id)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: frame detail */}
      <div className="flex-1 overflow-hidden">
        {activeFrame ? (
          <FrameDetail frame={activeFrame} />
        ) : (
          <EmptyState
            icon={IconLayoutBoard}
            title="Select a frame"
            description="Choose a frame from the list to view details or generate content."
          />
        )}
      </div>

      <FrameForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        editFrame={editFrame}
      />

      <ConfirmDialog
        open={!!deleteFrameId}
        onOpenChange={(open) => !open && setDeleteFrameId(null)}
        title="Delete frame?"
        description="This will permanently remove this frame and all its generated content."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
