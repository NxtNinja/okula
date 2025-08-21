"use client";

import ItemList from "@/components/item-list/ItemList";
import ConversationFallback from "@/components/shared/conversation/ConversationFallback";
import React from "react";
import AddFriendDialog from "./_components/AddFriendDialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import Request from "./_components/Request";

const FriendsPage = () => {
  const requests = useQuery(api.requests.get);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full">
      <div className="lg:flex-shrink-0 lg:w-92">
        <ItemList title="Friend Requests" action={<AddFriendDialog />}>
          {requests ? (
            requests.length === 0 ? (
              <p className="w-full h-full flex justify-center items-center">
                No friend requests found
              </p>
            ) : (
              requests.map((request) => (
                <Request
                  key={request.request._id}
                  id={request.request._id}
                  imageUrl={request.sender.imageUrl}
                  username={request.sender.username}
                  email={request.sender.email}
                />
              ))
            )
          ) : (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </ItemList>
      </div>
      <div className="flex-1">
        <ConversationFallback />
      </div>
    </div>
  );
};

export default FriendsPage;
