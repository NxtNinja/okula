import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef } from "react";

export const useMarkRead = () => {
  const markRead = useMutation(api.conversation.markRead);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<Id<"messages"> | null>(null);

  const debouncedMarkRead = useCallback(
    (conversationId: Id<"conversations">, messageId: Id<"messages">) => {
      // Skip if it's the same message
      if (lastMessageIdRef.current === messageId) {
        return;
      }

      lastMessageIdRef.current = messageId;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout - wait 500ms before marking as read
      timeoutRef.current = setTimeout(() => {
        markRead({ conversationId, messageId }).catch((error) => {
          // Silently handle conflicts - the mutation has retry logic
          if (!error.message.includes("Documents read from or written to")) {
            console.error("Failed to mark message as read:", error);
          }
        });
      }, 500);
    },
    [markRead]
  );

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedMarkRead, cleanup };
};
