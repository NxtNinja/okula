"use client";

import ItemList from "@/components/item-list/ItemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React, { PropsWithChildren } from "react";
import DMConversationItem from "./_components/DMConversationItem";
import CreateGroupDialog from "./_components/CreateGroupDialog";
import GroupConversationItem from "./_components/GroupConversationItem";

type Props = PropsWithChildren;

const ConversationsLayout = ({ children }: Props) => {
  const conversations = useQuery(api.conversations.get);
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full overflow-hidden">
      <div className="lg:flex-shrink-0 lg:w-92">
        <ItemList title="Conversations" action={<CreateGroupDialog />}>
          {conversations ? (
            conversations.length === 0 ? (
              <p className="w-full h-full flex justify-center items-center">
                No friend conversations found
              </p>
            ) : (
              conversations.map((conversation) => {
                return conversation.conversation.isGroup ? (
                  <GroupConversationItem
                    key={conversation.conversation._id}
                    id={conversation.conversation._id}
                    name={conversation.conversation.name || ""}
                    lastMessageContent={conversation.lastMessage?.content}
                    lastMessageSender={conversation.lastMessage?.sender}
                    unseenCount={conversation.unseenCount}
                  />
                ) : (
                  <DMConversationItem
                    key={conversation.conversation._id}
                    id={conversation.conversation._id}
                    username={conversation.otherMember?.username || ""}
                    imageUrl={conversation.otherMember?.imageUrl || ""}
                    lastMessageContent={conversation.lastMessage?.content}
                    lastMessageSender={conversation.lastMessage?.sender}
                    unseenCount={conversation.unseenCount}
                  />
                );
              })
            )
          ) : (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </ItemList>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
};

export default ConversationsLayout;
