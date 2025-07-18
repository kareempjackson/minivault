import { useState, useEffect, useCallback } from "react";
import { api, Conversation } from "@/lib/api";

export interface UseConversationsReturn {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  selectConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectConversation = useCallback(
    (conversation: Conversation | null) => {
      setSelectedConversation(conversation);
    },
    []
  );

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    await fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    selectedConversation,
    isLoading,
    error,
    selectConversation,
    refreshConversations,
  };
}
