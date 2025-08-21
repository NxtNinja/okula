import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration to mark existing messages as unencrypted
 * This ensures backward compatibility with messages created before encryption was added
 */
export const markExistingMessagesAsUnencrypted = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    
    let updated = 0;
    for (const message of messages) {
      // If message doesn't have isEncrypted field, set it to false
      if (message.isEncrypted === undefined) {
        await ctx.db.patch(message._id, {
          isEncrypted: false,
        });
        updated++;
      }
    }
    
    return { updated };
  },
});

/**
 * Check if a conversation has any encrypted messages
 */
export const checkConversationEncryption = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    
    const encrypted = messages.filter(m => m.isEncrypted === true).length;
    const unencrypted = messages.filter(m => m.isEncrypted !== true).length;
    
    return {
      total: messages.length,
      encrypted,
      unencrypted,
      allEncrypted: encrypted === messages.length && messages.length > 0,
    };
  },
});
