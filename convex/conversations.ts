import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { generateServerEncryptionKey, serverDecryptMessage } from "./_utils/encryption";

export const get = query({
  args: {},
  handler: async (ctx, args) => {
    const indentity = await ctx.auth.getUserIdentity();

    if (!indentity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: indentity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const conversationMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
      .collect();

    const conversations = await Promise.all(
      conversationMemberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);

        if (!conversation) {
          throw new ConvexError("Conversation not found");
        }

        return conversation;
      })
    );

    const conversationWithDetails = await Promise.all(
      conversations.map(async (conversation, index) => {
        const allConversationMemberships = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        const lastMessage = await getLastMessageDetails({
          ctx,
          id: conversation.lastMessageId as Id<"messages">,
          conversationId: conversation._id,
          memberIds: allConversationMemberships.map(m => m.memberId),
        });

        const lastSeenMessage = conversationMemberships[index].lastSeenMessage
          ? await ctx.db.get(conversationMemberships[index].lastSeenMessage!)
          : null;

        const lastSeenMessageTime = lastSeenMessage
          ? lastSeenMessage._creationTime
          : -1;

        const unSeenMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .filter((q) => q.gt(q.field("_creationTime"), lastSeenMessageTime))
          .filter((q) => q.neq(q.field("sender"), currentUser._id))
          .collect();

        if (conversation.isGroup) {
          return {
            conversation,
            lastMessage,
            unseenCount: unSeenMessages.length,
          };
        } else {
          const otherMemberShips = allConversationMemberships.filter(
            (membership) => membership.memberId !== currentUser._id
          )[0];

          const otherMember = await ctx.db.get(otherMemberShips.memberId);

          return {
            conversation,
            otherMember,
            lastMessage,
            unseenCount: unSeenMessages.length,
          };
        }
      })
    );

    return conversationWithDetails;
  },
});

const getMessageContent = (type: string, content: string[]) => {
  switch (type) {
    case "text":
      // Return the first content item (messages are stored as arrays)
      return content[0] || "";
    default:
      return "[Non-text]";
  }
};

const getLastMessageDetails = async ({
  ctx,
  id,
  conversationId,
  memberIds,
}: {
  ctx: QueryCtx | MutationCtx;
  id: Id<"messages">;
  conversationId: Id<"conversations">;
  memberIds: Id<"users">[];
}) => {
  if (!id) {
    return null;
  }

  const message = await ctx.db.get(id);

  if (!message) {
    return null;
  }

  const sender = await ctx.db.get(message.sender);

  if (!sender) {
    return null;
  }

  let content: string;
  
  // Check if message is encrypted and decrypt if needed
  if (message.isEncrypted && message.content && message.content.length > 0) {
    try {
      // Generate the same encryption key used during encryption
      const encryptionKey = generateServerEncryptionKey(conversationId, memberIds);
      
      // Get the encrypted content
      const encryptedContent = getMessageContent(message.type, message.content);
      
      // Decrypt the message
      content = serverDecryptMessage(encryptedContent, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      content = "[Encrypted message]";
    }
  } else {
    // Unencrypted message
    content = getMessageContent(message.type, message.content);
  }

  return {
    content,
    sender: sender.username,
  };
};
