// Example usage in your message list component

import { useMarkRead } from '@/hooks/useMarkRead';
import { useEffect, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';

interface Message {
  _id: Id<"messages">;
  // Add other message properties as needed
}

interface MessageListProps {
  conversationId: Id<"conversations">;
  messages: Message[];
}

export function MessageList({ conversationId, messages }: MessageListProps) {
  const { debouncedMarkRead, cleanup } = useMarkRead();
  
  // Mark messages as read when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              debouncedMarkRead(conversationId, messageId as Id<"messages">);
            }
          }
        });
      },
      {
        threshold: 0.5, // Message is considered "read" when 50% visible
      }
    );

    // Observe all message elements
    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [messages, conversationId, debouncedMarkRead, cleanup]);

  return (
    <div>
      {messages.map((message) => (
        <div key={message._id} data-message-id={message._id}>
          {/* Your message content */}
        </div>
      ))}
    </div>
  );
}

// Alternative: Mark as read on scroll (simpler approach)
interface SimpleMessageListProps {
  conversationId: Id<"conversations">;
  messages: Message[];
}

export function SimpleMessageList({ conversationId, messages }: SimpleMessageListProps) {
  const { debouncedMarkRead, cleanup } = useMarkRead();
  
  // Mark the last visible message as read on scroll
  const handleScroll = useCallback(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      debouncedMarkRead(conversationId, lastMessage._id);
    }
  }, [messages, conversationId, debouncedMarkRead]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div onScroll={handleScroll}>
      {messages.map((message) => (
        <div key={message._id}>
          {/* Your message content */}
        </div>
      ))}
    </div>
  );
}
