import { useState, useMemo, useRef, useEffect } from "react";
import {
  IconPhoto,
  IconVideo,
  IconFileText,
  IconFile,
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconUpload,
  IconTrash,
  IconLink,
  IconFolderOpen,
  IconLoader2,
  IconX,
  IconPlayerPlay,
  IconDownload,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAssetStore } from "@/stores/asset-store";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/asset";

interface LocalFileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function fileTypeCategory(fileType: string): "image" | "video" | "document" {
  if (
    fileType.startsWith("image") ||
    ["jpg", "png", "gif", "webp", "svg"].includes(fileType)
  )
    return "image";
  if (
    fileType.startsWith("video") ||
    ["mp4", "mov", "avi", "mkv"].includes(fileType)
  )
    return "video";
  return "document";
}

const TYPE_ICONS: Record<string, Icon> = {
  image: IconPhoto,
  video: IconVideo,
  document: IconFileText,
};

const TYPE_COLORS: Record<string, string> = {
  image: "#3b82f6",
  video: "#a855f7",
  document: "#f97316",
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isImageType(fileType: string): boolean {
  return (
    fileType.startsWith("image") ||
    ["jpg", "png", "gif", "webp", "svg", "jpeg"].includes(
      fileType.toLowerCase(),
    )
  );
}

function isVideoType(fileType: string): boolean {
  return (
    fileType.startsWith("video") ||
    ["mp4", "mov", "avi", "mkv", "webm"].includes(fileType.toLowerCase())
  );
}

// ─── Asset Thumbnail ─────────────────────────────────────────────

function AssetThumbnail({
  asset,
  className,
  iconSize = "h-8 w-8",
}: {
  asset: { fileUrl: string; fileType: string; fileName: string };
  className?: string;
  iconSize?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const category = fileTypeCategory(asset.fileType);
  const TypeIcon = TYPE_ICONS[category] ?? IconFile;
  const color = TYPE_COLORS[category] ?? "#6b7280";

  if (isImageType(asset.fileType) && asset.fileUrl && !imgError) {
    return (
      <img
        src={asset.fileUrl}
        alt={asset.fileName}
        className={cn("h-full w-full object-cover", className)}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  if (isVideoType(asset.fileType) && asset.fileUrl && !imgError) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-muted/30">
        <IconPlayerPlay className="h-8 w-8 text-purple-400/60" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <TypeIcon className={iconSize} style={{ color }} />
    </div>
  );
}

// ─── Asset Detail Viewer ─────────────────────────────────────────

function AssetDetailViewer({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!asset) return null;

  const category = fileTypeCategory(asset.fileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{asset.fileName}</DialogTitle>
          <DialogDescription>
            {category.charAt(0).toUpperCase() + category.slice(1)} &middot;{" "}
            {formatSize(asset.fileSize)}
            {asset.width && asset.height && ` \u00B7 ${asset.width}x${asset.height}`}
            {" \u00B7 "}
            {formatDate(asset.createdAt)}
          </DialogDescription>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/20 border border-border overflow-hidden">
          {isImageType(asset.fileType) && asset.fileUrl ? (
            <img
              src={asset.fileUrl}
              alt={asset.fileName}
              className="max-h-[60vh] max-w-full object-contain"
            />
          ) : isVideoType(asset.fileType) && asset.fileUrl ? (
            <video
              src={asset.fileUrl}
              controls
              className="max-h-[60vh] max-w-full"
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8">
              <IconFileText className="h-16 w-16 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Preview not available for this file type
              </p>
            </div>
          )}
        </div>

        {/* Details & actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {asset.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">
                {tag}
              </Badge>
            ))}
            {asset.frameId && (
              <Badge variant="outline" className="text-[10px] px-1.5 gap-1">
                <IconLink className="h-2.5 w-2.5" />
                Linked
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {asset.fileUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(asset.fileUrl, "_blank")}
              >
                <IconExternalLink className="h-3.5 w-3.5" />
                Open
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Grid Card ───────────────────────────────────────────────────

function AssetGridCard({
  asset,
  onDelete,
  onClick,
}: {
  asset: Asset;
  onDelete: (id: string) => void;
  onClick: (asset: Asset) => void;
}) {
  const category = fileTypeCategory(asset.fileType);

  return (
    <div
      className="group flex flex-col border border-border bg-card transition-colors hover:bg-muted/20 cursor-pointer"
      onClick={() => onClick(asset)}
    >
      <div className="flex h-32 items-center justify-center border-b border-border bg-muted/20 relative overflow-hidden">
        <AssetThumbnail asset={asset} />
        {asset.frameId && (
          <span className="absolute left-2 top-2" title="Linked to frame">
            <IconLink className="h-3.5 w-3.5 text-green-400" />
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset.id);
          }}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
        >
          <IconTrash className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <p className="text-xs font-medium text-foreground truncate">
          {asset.fileName}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {formatSize(asset.fileSize)}
          </span>
          {asset.width && asset.height && (
            <span className="text-[11px] text-muted-foreground font-mono">
              {asset.width}x{asset.height}
            </span>
          )}
        </div>
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── List Row ────────────────────────────────────────────────────

function AssetListRow({
  asset,
  onDelete,
  onClick,
}: {
  asset: Asset;
  onDelete: (id: string) => void;
  onClick: (asset: Asset) => void;
}) {
  const category = fileTypeCategory(asset.fileType);

  return (
    <div
      className="group flex items-center gap-4 border border-border bg-card px-4 py-2.5 transition-colors hover:bg-muted/20 cursor-pointer"
      onClick={() => onClick(asset)}
    >
      {/* Thumbnail in list view */}
      <div className="h-8 w-8 shrink-0 overflow-hidden bg-muted/20 border border-border">
        <AssetThumbnail asset={asset} iconSize="h-4 w-4" />
      </div>
      <span className="flex-1 min-w-0 text-xs text-foreground truncate">
        {asset.fileName}
      </span>
      <span className="w-16 text-right text-[11px] text-muted-foreground capitalize shrink-0">
        {category}
      </span>
      <span className="w-20 text-right text-[11px] text-muted-foreground shrink-0">
        {formatSize(asset.fileSize)}
      </span>
      <span className="w-24 text-right text-[11px] text-muted-foreground font-mono shrink-0">
        {asset.width && asset.height
          ? `${asset.width}x${asset.height}`
          : "--"}
      </span>
      <div className="flex w-32 justify-end gap-1 shrink-0">
        {asset.frameId && (
          <IconLink className="h-3 w-3 text-green-400 shrink-0" title="Linked to frame" />
        )}
        {asset.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">
            {tag}
          </Badge>
        ))}
      </div>
      <span className="w-20 text-right text-[11px] text-muted-foreground shrink-0">
        {formatDate(asset.createdAt)}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(asset.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded shrink-0"
      >
        <IconTrash className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function AssetPage() {
  const assets = useAssetStore((s) => s.assets);
  const addAsset = useAssetStore((s) => s.addAsset);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showImportFolder, setShowImportFolder] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail viewer state
  const [viewerAsset, setViewerAsset] = useState<Asset | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Listen for sidebar upload trigger
  useEffect(() => {
    const handler = () => fileInputRef.current?.click();
    window.addEventListener("asset-upload-trigger", handler);
    return () => window.removeEventListener("asset-upload-trigger", handler);
  }, []);

  const handleImportFolder = async () => {
    const path = folderPath.trim();
    if (!path) return;

    setImporting(true);
    setImportStatus("Scanning folder...");

    try {
      const files = await invoke<LocalFileInfo[]>("scan_directory", { path });

      if (files.length === 0) {
        setImportStatus("No files found in that folder.");
        setImporting(false);
        return;
      }

      let uploaded = 0;
      const errors: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setImportStatus(
          `Uploading ${i + 1}/${files.length}: ${file.fileName}...`,
        );

        try {
          const fileUrl = await invoke<string>("upload_file_to_cloud", {
            filePath: file.filePath,
          });
          addAsset({
            fileName: file.fileName,
            fileUrl,
            fileType: file.fileType,
            fileSize: file.fileSize,
            tags: [],
          });
          uploaded++;
        } catch (err) {
          const msg = `${file.fileName}: ${err}`;
          console.error("Upload failed:", msg);
          errors.push(msg);
        }
      }

      if (errors.length > 0) {
        setImportStatus(
          `Uploaded ${uploaded}/${files.length}. Errors: ${errors.join("; ")}`,
        );
      } else {
        setImportStatus(
          `Done! ${uploaded}/${files.length} files uploaded to cloud.`,
        );
        setTimeout(() => {
          setShowImportFolder(false);
          setFolderPath("");
          setImportStatus("");
        }, 2000);
      }
    } catch (err) {
      setImportStatus(`Error: ${err}`);
    } finally {
      setImporting(false);
    }
  };

  const filtered = useMemo(() => {
    let result = assets;

    if (typeFilter !== "all") {
      result = result.filter(
        (a) => fileTypeCategory(a.fileType) === typeFilter,
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.fileName.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [assets, typeFilter, search]);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    // Capture files before async work (React synthetic event may be reused)
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImporting(true);

    for (const file of files) {
      setImportStatus(`Uploading ${file.name}...`);

      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const chunks: string[] = [];
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(
            String.fromCharCode(...bytes.subarray(i, i + chunkSize)),
          );
        }
        const dataBase64 = btoa(chunks.join(""));

        const fileUrl = await invoke<string>("upload_data_to_cloud", {
          fileName: file.name,
          dataBase64,
        });

        addAsset({
          fileName: file.name,
          fileUrl,
          fileType: file.type || file.name.split(".").pop() || "unknown",
          fileSize: file.size,
          tags: [],
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        setImportStatus(`Error uploading ${file.name}: ${err}`);
        // Fallback to blob URL if cloud upload fails
        const url = URL.createObjectURL(file);
        addAsset({
          fileName: file.name,
          fileUrl: url,
          fileType: file.type || file.name.split(".").pop() || "unknown",
          fileSize: file.size,
          tags: [],
        });
      }
    }

    setImporting(false);
    setImportStatus("");
  };

  const openViewer = (asset: Asset) => {
    setViewerAsset(asset);
    setViewerOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />

      {/* Detail Viewer Dialog */}
      <AssetDetailViewer
        asset={viewerAsset}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <IconPhoto className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
            Asset Manager
          </h1>
          <span className="text-sm text-muted-foreground">
            ({assets.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {importing && !showImportFolder && importStatus && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
              {importStatus}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => setShowImportFolder(true)}
            disabled={importing}
          >
            <IconFolderOpen className="h-4 w-4" />
            Import Folder
          </Button>
          <Button onClick={handleUpload} disabled={importing}>
            <IconUpload className="h-4 w-4" />
            Upload Asset
          </Button>
        </div>
      </div>

      {/* Import Folder Dialog */}
      {showImportFolder && (
        <div className="shrink-0 border-b border-border bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <IconFolderOpen className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="Enter folder path (e.g. C:\Users\files\assets)"
                className="pl-8"
                disabled={importing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleImportFolder();
                }}
              />
            </div>
            <Button
              onClick={handleImportFolder}
              disabled={importing || !folderPath.trim()}
              size="sm"
            >
              {importing ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconFolderOpen className="h-4 w-4" />
              )}
              {importing ? "Importing..." : "Import"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setShowImportFolder(false);
                setFolderPath("");
                setImportStatus("");
              }}
              disabled={importing}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
          {importStatus && (
            <p className="mt-2 text-xs text-muted-foreground">{importStatus}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border px-6 py-2.5">
        <div className="relative flex-1 max-w-xs">
          <IconSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-8"
          />
        </div>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center border border-border">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
          >
            <IconLayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
          >
            <IconList className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <IconFile className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No assets found
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {search
                  ? "Try adjusting your search or filter."
                  : "Upload your first asset to get started."}
              </p>
            </div>
            {!search && (
              <Button onClick={handleUpload} variant="outline" size="sm">
                <IconUpload className="h-4 w-4" />
                Upload Asset
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((asset) => (
              <AssetGridCard
                key={asset.id}
                asset={asset}
                onDelete={removeAsset}
                onClick={openViewer}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-4">
            <div className="flex items-center gap-4 px-4 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="w-8 shrink-0" />
              <span className="flex-1 min-w-0">Name</span>
              <span className="w-16 text-right shrink-0">Type</span>
              <span className="w-20 text-right shrink-0">Size</span>
              <span className="w-24 text-right shrink-0">Dimensions</span>
              <span className="w-32 text-right shrink-0">Tags</span>
              <span className="w-20 text-right shrink-0">Date</span>
              <span className="w-8 shrink-0" />
            </div>
            {filtered.map((asset) => (
              <AssetListRow
                key={asset.id}
                asset={asset}
                onDelete={removeAsset}
                onClick={openViewer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
