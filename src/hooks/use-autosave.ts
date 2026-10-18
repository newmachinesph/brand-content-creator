import { useEffect, useRef } from "react";

export function useAutosave(
  value: string,
  onSave: (value: string) => void,
  delay: number = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const initialRef = useRef(true);

  useEffect(() => {
    // Skip the initial render
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSave(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, onSave]);
}
