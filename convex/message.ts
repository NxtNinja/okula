import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { generateServerEncryptionKey, serverEncryptMessageArray } from "./_utils/encryption";

export const create = mutation({
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

    // Single query to verify membership - no need to fetch all members
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

    // Get members for encryption key - optimized query
    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    
    const memberIds = members.map(m => m.memberId);
    
    // Generate encryption key
    const encryptionKey = generateServerEncryptionKey(
      args.conversationId,
      memberIds
    );
    
    // Encrypt content with fast encryption
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
