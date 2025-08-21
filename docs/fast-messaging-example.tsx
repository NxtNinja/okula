import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOptimisticMessages, useMergedMessages } from "@/hooks/useOptimisticMessages";
import { useState, useCallback, KeyboardEvent } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface LightningFastChatProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
}

export function LightningFastChat({ conversationId, currentUserId }: LightningFastChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Fetch real messages
  const realMessages = useQuery(api.messages.get, { id: conversationId }) || [];
  
  // Optimistic messaging
  const { 
    optimisticMessages, 
    sendOptimisticMessage
  } = useOptimisticMessages(conversationId, currentUserId);
  
  // Merge real and optimistic messages
  const allMessages = useMergedMessages(realMessages, optimisticMessages);
  
  // Send message with optimistic update
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;
    
    const messageContent = inputValue.trim();
    setInputValue(""); // Clear input immediately
    setIsSending(true);
    
    try {
      // This will show the message immediately in UI
      await sendOptimisticMessage([messageContent]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally restore the input on error
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, sendOptimisticMessage]);
  
  // Handle enter key
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4">
        {allMessages.map((message) => (
          <MessageItem 
            key={message._id} 
            message={message}
            isOptimistic={message.isOptimistic}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: {
    _id: string;
    sender: Id<"users">;
    content: string[];
    isOptimistic?: boolean;
  };
  isOptimistic?: boolean;
  currentUserId: Id<"users">;
}

function MessageItem({ message, isOptimistic, currentUserId }: MessageItemProps) {
  const isOwnMessage = message.sender === currentUserId;
  
  return (
    <div 
      className={`
        mb-2 p-2 rounded max-w-[70%]
        ${isOwnMessage ? 'ml-auto bg-blue-500 text-white' : 'bg-gray-200'}
        ${isOptimistic ? 'opacity-70' : ''}
      `}
    >
      <p>{message.content[0]}</p>
      {isOptimistic && (
        <span className="text-xs opacity-50">Sending...</span>
      )}
    </div>
  );
}

// Alternative: Using React 19 useOptimistic hook (if available)
interface ReactOptimisticChatProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
}

export function ReactOptimisticChat({ conversationId, currentUserId }: ReactOptimisticChatProps) {
  const [inputValue, setInputValue] = useState("");
  // const realMessages = useQuery(api.messages.get, { id: conversationId }) || [];
  const sendMessage = useMutation(api.fastMessage.createFast);
  
  // React 19 useOptimistic hook (when available)
  // const [messages, addOptimisticMessage] = useOptimistic(
  //   realMessages,
  //   (state, newMessage) => [...state, newMessage]
  // );
  
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const messageContent = inputValue.trim();
    setInputValue("");
    
    // Add optimistic message
    // addOptimisticMessage({
    //   _id: `temp-${Date.now()}`,
    //   sender: currentUserId,
    //   content: [messageContent],
    //   _creationTime: Date.now(),
    // });
    
    await sendMessage({
      conversationId,
      type: "text",
      content: [messageContent],
    });
  };
  
  return (
    // Similar UI as above
    <div>
      <p>Chat UI - This is a placeholder for React 19 optimistic updates demo</p>
      <button onClick={handleSend}>Send (placeholder)</button>
    </div>
  );
}
