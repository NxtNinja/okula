import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

/**
 * Get encryption info for a conversation
 * This helps the client generate the same key as the server
 */
export const getConversationEncryptionInfo = query({
  args: {
    conversationId: v.id("conversations"),
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
      throw new Error("User not found");
    }
    
    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique();
    
    if (!membership) {
      throw new Error("Not a member of this conversation");
    }
    
    // Get all member IDs for key generation
    const allMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    
    const memberIds = allMemberships.map(m => m.memberId).sort();
    
    return {
      conversationId: args.conversationId,
      memberIds,
      keyHash: membership.keyHash,
    };
  },
});
