import React, { ReactNode, useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EncryptionStatus } from "@/components/shared/EncryptionStatus";

type Props = {
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  seen?: ReactNode;
  type: string;
  isEncrypted?: boolean;
};

const Message = ({
  fromCurrentUser,
  senderImage,
  senderName,
  lastByUser,
  content,
  createdAt,
  seen,
  type,
  isEncrypted = false,
}: Props) => {
  const formatTime = (timestamp: number) => {
    return format(timestamp, "HH:mm");
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [content]);

  return (
    <div
      className={cn("flex items-end", {
        "justify-end": fromCurrentUser,
      })}
    >
      <div
        className={cn("flex flex-col w-full mx-2", {
          "order-1 items-end": fromCurrentUser,
          "order-2 items-start": !fromCurrentUser,
        })}
      >
        <div
          className={cn("px-4 py-2 rounded-lg max-w-[90%] sm:max-w-[70%]", {
            "bg-primary text-primary-foreground": fromCurrentUser,
            "bg-secondary text-secondary-foreground": !fromCurrentUser,
            "rounded-br-none": !lastByUser && fromCurrentUser,
            "rounded-bl-none": !lastByUser && !fromCurrentUser,
          })}
        >
          {type === "text" ? (
            <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere">
              {content}
            </p>
          ) : null}
          <div
            className={cn("text-xs flex items-center gap-2 w-full my-1", {
              "text-primary-foreground justify-end": fromCurrentUser,
              "text-secondary-foreground justify-start": !fromCurrentUser,
            })}
          >
            <span>{formatTime(createdAt)}</span>
            <EncryptionStatus isEncrypted={isEncrypted} showDetails={true} />
          </div>
        </div>
        {seen}
      </div>

      <Avatar
        className={cn("h-8 w-8 relative", {
          "order-2": fromCurrentUser,
          "order-1": !fromCurrentUser,
          invisible: lastByUser,
        })}
      >
        <AvatarImage src={senderImage} />
        <AvatarFallback>{senderName.substring(0, 1)}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default Message;
