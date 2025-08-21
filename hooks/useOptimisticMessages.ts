import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useCallback } from "react";

interface OptimisticMessage {
  _id: string; // Temporary ID
  sender: Id<"users">;
  conversationId: Id<"conversations">;
  type: string;
  content: string[];
  isEncrypted: boolean;
  _creationTime: number;
  isOptimistic: true;
}

export const useOptimisticMessages = (
  conversationId: Id<"conversations">,
  currentUserId: Id<"users">
) => {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const sendMessage = useMutation(api.fastMessage.createFast);
  
  const sendOptimisticMessage = useCallback(
    async (content: string[], type: string = "text") => {
      // Create optimistic message with temporary ID
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: OptimisticMessage = {
        _id: tempId,
        sender: currentUserId,
        conversationId,
        type,
        content,
        isEncrypted: false,
        _creationTime: Date.now(),
        isOptimistic: true,
      };

      // Add to optimistic messages immediately
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send to server
        const messageId = await sendMessage({
          conversationId,
          type,
          content,
        });

        // Remove optimistic message after server confirms
        setOptimisticMessages((prev) => 
          prev.filter((msg) => msg._id !== tempId)
        );

        return messageId;
      } catch (error) {
        // Remove optimistic message on error
        setOptimisticMessages((prev) => 
          prev.filter((msg) => msg._id !== tempId)
        );
        
        throw error;
      }
    },
    [conversationId, currentUserId, sendMessage]
  );

  // Clear optimistic messages when conversation changes
  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([]);
  }, []);

  return {
    optimisticMessages,
    sendOptimisticMessage,
    clearOptimisticMessages,
  };
};

// Hook for merging real and optimistic messages
export const useMergedMessages = (
  realMessages: any[],
  optimisticMessages: OptimisticMessage[]
) => {
  return [...realMessages, ...optimisticMessages].sort(
    (a, b) => a._creationTime - b._creationTime
  );
};
