import React from "react";
import { Conversation } from "@/lib/api";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 border ${
        isSelected
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "border-transparent hover:border-gray-200"
      }`}
    >
      <div className="space-y-1.5">
        <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {truncateText(conversation.prompt, 60)}
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {formatDate(conversation.timestamp)}
        </div>
      </div>
    </button>
  );
}
