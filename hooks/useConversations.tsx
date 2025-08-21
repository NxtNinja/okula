import { useParams } from "next/navigation";
import { useMemo } from "react";

export const useConversations = () => {
  const params = useParams();

  const conversationId = useMemo(() => {
    const id = params.conversationId;
    // Handle the case where conversationId might be an array
    if (Array.isArray(id)) {
      return id[0] || "";
    }
    return id || "";
  }, [params.conversationId]);

  const isActive = useMemo(() => !!conversationId, [conversationId]);

  return { conversationId, isActive };
};
