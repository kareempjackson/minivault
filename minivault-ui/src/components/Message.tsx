import React from "react";

interface MessageProps {
  isUser: boolean;
  content: string;
  timestamp?: string;
}

export function Message({ isUser, content, timestamp }: MessageProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed text-sm">
          {content}
        </div>
        {timestamp && (
          <div
            className={`text-xs mt-2 font-medium ${
              isUser ? "text-blue-100" : "text-gray-400"
            }`}
          >
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
