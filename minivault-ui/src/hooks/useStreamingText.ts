import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface UseStreamingTextReturn {
  text: string;
  isStreaming: boolean;
  error: string | null;
  startStream: (prompt: string, model?: string) => Promise<void>;
  reset: () => void;
}

export function useStreamingText(): UseStreamingTextReturn {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(
    async (prompt: string, model: string = "distilgpt2") => {
      try {
        setError(null);
        setIsStreaming(true);
        setText("");

        cleanupRef.current = api.streamText(
          prompt,
          model,
          (data: string) => {
            setText((prev) => prev + data);
          },
          () => {
            setIsStreaming(false);
            cleanupRef.current = null;
          },
          (error: Error) => {
            setError(error.message);
            setIsStreaming(false);
            cleanupRef.current = null;
          }
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while streaming"
        );
        setIsStreaming(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setText("");
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    text,
    isStreaming,
    error,
    startStream,
    reset,
  };
}
