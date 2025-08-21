"use client";

import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/convex/_generated/api";
import { useConversations } from "@/hooks/useConversations";
import { useMutationState } from "@/hooks/useMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConvexError } from "convex/values";
import React, { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const chatMessageSchema = z.object({
  content: z.string().min(1),
});

// Cache for user and member data
interface CachedData {
  userId?: Id<"users">;
  memberIds?: Id<"users">[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const FastChatInput = () => {
  const { conversationId } = useConversations();
  const [isTyping, setIsTyping] = useState(false);
  const [cachedData] = useState<CachedData | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { mutate: createMessage, pending } = useMutationState(
    api.fastMessage.createUltraFast
  );

  const form = useForm<z.infer<typeof chatMessageSchema>>({
    defaultValues: {
      content: "",
    },
    resolver: zodResolver(chatMessageSchema),
  });

  // Check if cached data is still valid
  const isCacheValid = useCallback(() => {
    if (!cachedData) return false;
    return Date.now() - cachedData.timestamp < CACHE_TTL;
  }, [cachedData]);

  const onSubmit = useCallback(async (data: z.infer<typeof chatMessageSchema>) => {
    try {
      // Use cached data if available and valid
      const messageArgs: {
        conversationId: string;
        content: string[];
        type: string;
        senderId?: Id<"users">;
        memberIds?: Id<"users">[];
      } = {
        conversationId,
        content: [data.content],
        type: "text",
      };

      if (isCacheValid() && cachedData?.userId && cachedData?.memberIds) {
        messageArgs.senderId = cachedData.userId;
        messageArgs.memberIds = cachedData.memberIds;
      }

      await createMessage(messageArgs);
      form.reset();
      
      // Clear typing state
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Unexpected error occurred"
      );
    }
  }, [conversationId, createMessage, form, cachedData, isCacheValid]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = e.target;

    if (selectionStart !== null) {
      form.setValue("content", value);
    }

    // Debounced typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing state
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [form, isTyping]);

  // Optimized keyboard handler
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // Don't submit if already pending
      if (!pending) {
        await form.handleSubmit(onSubmit)();
      }
    }
  }, [form, onSubmit, pending]);

  return (
    <Card className="w-full p-2 rounded-lg relative">
      <div className="flex gap-2 items-end w-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-2 items-end w-full"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => {
                return (
                  <FormItem className="h-full w-full">
                    <FormControl>
                      <TextareaAutosize
                        onKeyDown={handleKeyDown}
                        rows={1}
                        maxRows={3}
                        {...field}
                        onChange={handleInputChange}
                        placeholder="Message..."
                        className="min-h-full w-full resize-none border-0 outline-0 bg-card text-card-foreground placeholder:text-muted-foreground p-1.5"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button 
              disabled={pending || !form.watch("content")?.trim()} 
              size={"icon"} 
              type="submit"
              className="transition-opacity duration-200"
            >
              <SendHorizonal />
            </Button>
          </form>
        </Form>
      </div>
    </Card>
  );
};

export default FastChatInput;
