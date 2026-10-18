export function validateContentLength(
  content: string,
  captionLimit: number | undefined
): {
  charCount: number;
  limit: number | null;
  isOver: boolean;
  percentage: number;
} {
  const charCount = content.length;
  if (!captionLimit) {
    return { charCount, limit: null, isOver: false, percentage: 0 };
  }
  return {
    charCount,
    limit: captionLimit,
    isOver: charCount > captionLimit,
    percentage: Math.round((charCount / captionLimit) * 100),
  };
}
