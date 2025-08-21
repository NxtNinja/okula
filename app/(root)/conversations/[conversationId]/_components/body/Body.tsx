"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConversations } from "@/hooks/useConversations";
import { useQuery } from "convex/react";
import React, { useEffect, useRef, useMemo } from "react";
import Message from "./Message";
import { useMutationState } from "@/hooks/useMutation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  decryptXorMessageArray,
  generateConversationKey,
} from "@/lib/encryption";

type Props = {
  members: {
    lastSeenMessageId?: Id<"messages">;
    username?: string;
    [key: string]: unknown;
  }[];
};

const Body = ({ members }: Props) => {
  const { conversationId } = useConversations();
  const bodyRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.get, {
    id: conversationId as Id<"conversations">,
  });

  const encryptionInfo = useQuery(
    api.encryption.getConversationEncryptionInfo,
    {
      conversationId: conversationId as Id<"conversations">,
    }
  );

  const { mutate: markRead } = useMutationState(api.conversation.markRead);

  // Decrypt messages
  const decryptedMessages = useMemo(() => {
    if (!messages || !conversationId || !encryptionInfo) return null;

    try {
      // Generate the same key as the server using member IDs
      const encryptionKey = generateConversationKey(
        conversationId,
        encryptionInfo.memberIds
      );

      return messages.map((msg) => {
        // Only decrypt if message is marked as encrypted
        if (
          msg.isEncrypted &&
          msg.message.content &&
          msg.message.content.length > 0
        ) {
          try {
            // Decrypt the content
            const decryptedContent = decryptXorMessageArray(
              msg.message.content,
              encryptionKey
            );
            return {
              ...msg,
              message: {
                ...msg.message,
                content: decryptedContent,
              },
            };
          } catch (error) {
            console.error("Failed to decrypt message:", error);
            // Return original message if decryption fails
            return msg;
          }
        }
        // Return unencrypted messages as-is
        return msg;
      });
    } catch (error) {
      console.error("Failed to get encryption key:", error);
      return messages;
    }
  }, [messages, conversationId, encryptionInfo]);

  const formatSeenBy = (seenBy: string[]) => {
    switch (seenBy.length) {
      case 1:
        return (
          <p className="text-muted-foreground text-sm text-right">{`Seen by ${seenBy[0]}`}</p>
        );
      case 2:
        return (
          <p className="text-muted-foreground text-sm text-right">{`Seen by ${seenBy[0]} and ${seenBy[1]}`}</p>
        );
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <p className="text-muted-foreground text-sm text-right">
                  {`Seen by ${seenBy[0]}, ${seenBy[1]} and ${seenBy.length - 2} others`}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <ul>
                  {seenBy.map((name, index) => {
                    return <li key={index}>{name}</li>;
                  })}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };

  const getSeenMessage = (messageId: Id<"messages">) => {
    const seenMembers = members
      .filter((member) => member.lastSeenMessageId === messageId)
      .map((user) => user.username!.split(" ")[0]);

    if (seenMembers.length === 0) {
      return undefined;
    }

    return formatSeenBy(seenMembers);
  };

  // Mark messages as read when component mounts or when new messages arrive
  useEffect(() => {
    if (decryptedMessages && decryptedMessages.length > 0) {
      const latestMessage = decryptedMessages[0].message;
      // Always mark as read when viewing the conversation, regardless of who sent it
      markRead({
        conversationId,
        messageId: latestMessage._id,
      });
    }
  }, [decryptedMessages, conversationId, markRead]);

  // Also mark as read when the component becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        decryptedMessages &&
        decryptedMessages.length > 0
      ) {
        markRead({
          conversationId,
          messageId: decryptedMessages[0].message._id,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [decryptedMessages, conversationId, markRead]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [decryptedMessages]);

  return (
    <div
      ref={bodyRef}
      className="flex-1 w-full flex overflow-y-auto overflow-x-hidden flex-col-reverse gap-2 p-3 min-h-0 chat-scrollbar"
    >
      {decryptedMessages?.map(
        ({ message, senderImage, senderName, isCurrentUser }, index) => {
          const lastByUser =
            decryptedMessages[index - 1]?.message.sender ===
            decryptedMessages[index].message.sender;

          const seenMessage = isCurrentUser
            ? getSeenMessage(message._id)
            : undefined;

          return (
            <Message
              key={message._id}
              fromCurrentUser={isCurrentUser}
              senderImage={senderImage}
              senderName={senderName}
              lastByUser={lastByUser}
              content={message.content}
              createdAt={message._creationTime}
              seen={seenMessage}
              type={message.type}
              isEncrypted={message.isEncrypted || false}
            />
          );
        }
      )}
    </div>
  );
};

export default Body;
