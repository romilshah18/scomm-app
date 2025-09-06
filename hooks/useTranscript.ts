import { useCallback, useMemo, useState } from "react";

export interface TranscriptItem {
  id: string; // Unique identifier for proper ordering
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  final: boolean;
  timestamp?: number;
}

// Type guard for valid transcript roles
const isValidTranscriptRole = (role: string): role is "user" | "assistant" => {
  return role === "user" || role === "assistant";
};

export interface UseTranscriptReturn {
  transcript: TranscriptItem[];
  addTranscriptItem: (item: Omit<TranscriptItem, "timestamp">) => void;
  updateLastTranscriptItem: (text: string, final?: boolean) => void;
  clearTranscript: () => void;
  // Derived values for performance
  transcriptLength: number;
  hasTranscript: boolean;
  lastItem: TranscriptItem | null;
}

export function useTranscript(): UseTranscriptReturn {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const addTranscriptItem = useCallback(
    (item: Omit<TranscriptItem, "timestamp">) => {
      // Input validation
      if (!item.id || !item.text || !item.role) {
        console.warn("Invalid transcript item: missing required fields", item);
        return;
      }

      setTranscript((prev) => {
        // Create new item with timestamp
        const newItem: TranscriptItem = {
          ...item,
          timestamp: Date.now(),
        };
        
        // Use push for better performance than spread operator
        const newTranscript = [...prev];
        newTranscript.push(newItem);
        return newTranscript;
      });
    },
    []
  );

  const updateLastTranscriptItem = useCallback(
    (text: string, final: boolean = false) => {
      // Input validation
      if (typeof text !== 'string') {
        console.warn("Invalid text parameter: must be a string", text);
        return;
      }

      setTranscript((prev) => {
        // Early return if no items
        if (prev.length === 0) {
          return prev;
        }

        const lastItem = prev[prev.length - 1];
        
        // Check if we can update this item
        if (!isValidTranscriptRole(lastItem.role) || lastItem.final) {
          return prev; // No changes needed
        }

        // Only create new array if we need to update
        const newTranscript = [...prev];
        const lastIndex = newTranscript.length - 1;
        newTranscript[lastIndex] = {
          ...newTranscript[lastIndex],
          text,
          final,
        };
        
        return newTranscript;
      });
    },
    []
  );

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Memoized derived values for performance
  const transcriptLength = useMemo(() => transcript.length, [transcript.length]);
  const hasTranscript = useMemo(() => transcript.length > 0, [transcript.length]);
  const lastItem = useMemo(() => 
    transcript.length > 0 ? transcript[transcript.length - 1] : null, 
    [transcript]
  );

  return {
    transcript,
    addTranscriptItem,
    updateLastTranscriptItem,
    clearTranscript,
    // Derived values
    transcriptLength,
    hasTranscript,
    lastItem,
  };
}
