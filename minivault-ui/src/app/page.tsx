"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { ConversationItem } from "@/components/ConversationItem";
import { Message } from "@/components/Message";
import { useStreamingText } from "@/hooks/useStreamingText";
import { useConversations } from "@/hooks/useConversations";
import { ModelInfo, api } from "@/lib/api";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("distilgpt2");
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<
    Array<{ isUser: boolean; content: string; timestamp?: string }>
  >([]);
  const { text, isStreaming, error, startStream, reset } = useStreamingText();
  const {
    conversations,
    selectedConversation,
    isLoading,
    selectConversation,
    refreshConversations,
  } = useConversations();

  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelLoading(true);
        setModelError(false);

        const modelData = await api.getModels();
        setModels(modelData);

        const defaultModel =
          modelData.length > 0 ? modelData[0].name : "distilgpt2";
        setSelectedModel(defaultModel);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModelError(true);
        // Fallback to basic model list
        setModels([
          {
            name: "distilgpt2",
            description: "Fast, lightweight GPT-2 model (82M parameters)",
          },
        ]);
        setSelectedModel("distilgpt2");
      } finally {
        setModelLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Load selected conversation messages
  useEffect(() => {
    if (selectedConversation) {
      setCurrentMessages([
        {
          isUser: true,
          content: selectedConversation.prompt,
          timestamp: selectedConversation.timestamp,
        },
        {
          isUser: false,
          content: selectedConversation.response,
          timestamp: selectedConversation.timestamp,
        },
      ]);
      setPrompt("");
    } else {
      setCurrentMessages([]);
    }
  }, [selectedConversation]);

  // Add streaming text to messages
  useEffect(() => {
    if (text && isStreaming) {
      setCurrentMessages((prev) => {
        const newMessages = [...prev];
        if (
          newMessages.length > 0 &&
          !newMessages[newMessages.length - 1].isUser
        ) {
          // Update the last AI message
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: text,
          };
        } else {
          // Add new AI message
          newMessages.push({ isUser: false, content: text });
        }
        return newMessages;
      });
    }
  }, [text, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message
    const userMessage = {
      isUser: true,
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setCurrentMessages((prev) => [...prev, userMessage]);

    await startStream(prompt, selectedModel);

    setPrompt("");

    if (!isStreaming) {
      setTimeout(() => {
        refreshConversations();
      }, 1000);
    }
  };

  const handleNewChat = () => {
    selectConversation(null);
    reset();
    setPrompt("");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">MiniVault AI</h1>
            <Button
              onClick={handleNewChat}
              variant="secondary"
              size="sm"
              disabled={isStreaming}
            >
              New Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">
                Loading conversations...
              </p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-300 mb-3">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                No conversations yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => selectConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500 font-medium">
                Ask me anything and I&apos;ll help you out!
              </p>
            </div>
          ) : (
            currentMessages.map((message, index) => (
              <Message
                key={index}
                isUser={message.isUser}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-100 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            {modelLoading && (
              <div className="mb-3 text-center">
                <p className="text-sm text-blue-600 animate-pulse font-medium">
                  Loading models...
                </p>
              </div>
            )}

            {modelError && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-yellow-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Could not fetch models. Using fallback list.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      selectedConversation
                        ? "Continue the conversation..."
                        : "Ask me anything..."
                    }
                    className="w-full px-4 py-3 pr-12 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none text-sm font-medium transition-all duration-200 placeholder-gray-400"
                    rows={1}
                    disabled={isStreaming}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                  />
                  <div className="absolute right-3 bottom-2.5 text-xs text-gray-300 font-medium">
                    {prompt.length > 0 && `${prompt.length}`}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isStreaming || modelLoading || modelError}
                    className="h-[48px] px-3 py-2 border-0 bg-gray-50 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    {models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  loading={isStreaming}
                  disabled={!prompt.trim() || isStreaming || modelLoading}
                  size="md"
                  className="flex-shrink-0 h-[48px] w-[48px] p-0 rounded-xl transition-all duration-200"
                >
                  {isStreaming ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
