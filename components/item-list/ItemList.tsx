"use client";

import React, { PropsWithChildren, ReactNode } from "react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/useConversations";

type Props = PropsWithChildren<{
  title: string;
  action?: ReactNode;
}>;

const ItemList = ({ children, title, action: Action }: Props) => {
  const { isActive } = useConversations();
  return (
    <Card
      className={cn("hidden lg:min-h-[95dvh] h-[85dvh] w-full p-2", {
        block: !isActive,
        "lg:block": isActive,
      })}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {Action ? Action : null}
      </div>
      <div className="flex flex-col items-center justify-start gap-2 w-full chat-scrollbar px-2 h-[90%] overflow-y-auto">
        {children}
      </div>
    </Card>
  );
};

export default ItemList;
