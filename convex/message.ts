import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { generateServerEncryptionKey, serverEncryptMessageArray, serverHashKey } from "./_utils/encryption";

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.string(),
    content: v.array(v.string()),
  },
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

    // Get all conversation members to generate encryption key
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const memberIds = members.map(m => m.memberId);
    
    // Generate encryption key based on conversation and members
    const encryptionKey = generateServerEncryptionKey(
      args.conversationId,
      memberIds
    );
    
    // Encrypt the message content
    const encryptedContent = serverEncryptMessageArray(args.content, encryptionKey);
    
    // Store encrypted message
    const message = await ctx.db.insert("messages", {
      sender: currentUser._id,
      conversationId: args.conversationId,
      type: args.type,
      content: encryptedContent,
      isEncrypted: true,
      encryptionVersion: "v1",
    });

    // Update conversation's last message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: message,
    });
    
    // Update member's key hash if not already set
    const keyHash = serverHashKey(encryptionKey);
    if (!membership.keyHash || membership.keyHash !== keyHash) {
      await ctx.db.patch(membership._id, {
        keyHash: keyHash,
      });
    }

    return message;
  },
});
