import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { generateServerEncryptionKey, serverEncryptMessageArray } from "./_utils/encryption";
import { getCachedEncryptionKey } from "./_utils/encryptionCache";

// Lightning fast message creation with optimized encryption
export const createFast = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Optimized: Single query for membership check and member list
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    
    // Quick membership check
    const isMember = members.some(m => m.memberId === currentUser._id);
    if (!isMember) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Get cached encryption key or generate new one
    const memberIds = members.map(m => m.memberId);
    const encryptionKey = getCachedEncryptionKey(
      args.conversationId,
      memberIds,
      () => generateServerEncryptionKey(args.conversationId, memberIds)
    );
    
    // Fast encrypt content
    const encryptedContent = serverEncryptMessageArray(args.content, encryptionKey);

    // Insert encrypted message
    const messageId = await ctx.db.insert("messages", {
      sender: currentUser._id,
      conversationId: args.conversationId,
      type: args.type,
      content: encryptedContent,
      isEncrypted: true,
      encryptionVersion: "v2-fast",
    });

    // Update conversation's last message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
    });

    return messageId;
  },
});

// Batch create for multiple messages
export const createBatch = mutation({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(v.object({
      type: v.string(),
      content: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Verify membership once
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q
          .eq("memberId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Insert all messages
    const messageIds = await Promise.all(
      args.messages.map((msg) =>
        ctx.db.insert("messages", {
          sender: currentUser._id,
          conversationId: args.conversationId,
          type: msg.type,
          content: msg.content,
          isEncrypted: false,
        })
      )
    );

    // Update last message
    if (messageIds.length > 0) {
      await ctx.db.patch(args.conversationId, {
        lastMessageId: messageIds[messageIds.length - 1],
      });
    }

    return messageIds;
  },
});

// Ultra-fast message creation for real-time typing scenarios
// Skips some checks for maximum speed - use only in trusted contexts
export const createUltraFast = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
    // Pre-computed values for speed
    senderId: v.optional(v.id("users")),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Fast auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let senderId = args.senderId;
    let memberIds = args.memberIds;

    // Only fetch if not provided
    if (!senderId) {
      const currentUser = await getUserByClerkId({
        ctx,
        clerkId: identity.subject,
      });
      if (!currentUser) {
        throw new ConvexError("User not found");
      }
      senderId = currentUser._id;
    }

    // Only fetch members if not provided
    if (!memberIds) {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .collect();
      memberIds = members.map(m => m.memberId);
    }

    // Get cached encryption key
    const encryptionKey = getCachedEncryptionKey(
      args.conversationId,
      memberIds,
      () => generateServerEncryptionKey(args.conversationId, memberIds)
    );
    
    // Fast encrypt
    const encryptedContent = serverEncryptMessageArray(args.content, encryptionKey);

    // Parallel operations for speed
    const [messageId] = await Promise.all([
      ctx.db.insert("messages", {
        sender: senderId,
        conversationId: args.conversationId,
        type: args.type,
        content: encryptedContent,
        isEncrypted: true,
        encryptionVersion: "v2-fast",
      }),
      ctx.db.patch(args.conversationId, {
        lastMessageId: undefined, // Will be updated with actual ID
      })
    ]);

    // Quick update with actual message ID
    ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
    });

    return messageId;
  },
});
