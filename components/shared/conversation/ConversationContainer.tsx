import { Card } from "@/components/ui/card";
import React, { PropsWithChildren } from "react";

type Props = PropsWithChildren;

const ConversationContainer = ({ children }: Props) => {
  return (
    <Card className="w-full h-[95dvh] p-2 flex flex-col gap-2 overflow-hidden max-w-full">
      {children}
    </Card>
  );
};

export default ConversationContainer;
