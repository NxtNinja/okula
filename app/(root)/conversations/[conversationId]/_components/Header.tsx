import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  imageUrl?: string;
  username: string;
  options?: {
    label: string;
    destructive?: boolean;
    onClick?: () => void;
  }[];
};

const Header = ({ imageUrl, username, options }: Props) => {
  return (
    <Card className="w-full flex rounded-lg items-center p-2 justify-between">
      <div className="flex items-center gap-2 w-full">
        <Link href={"/conversations"} className="block lg:hidden">
          <ArrowLeftIcon />
        </Link>
        <div className="flex items-center gap-2 w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={imageUrl} />
            <AvatarFallback>{username.substring(0, 1)}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold">{username}</h2>
        </div>
        <div className="flex gap-2">
          {options ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"icon"} variant={"secondary"}>
                  <Settings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {options.map((option, id) => {
                  return (
                    <DropdownMenuItem
                      key={id}
                      onClick={option.onClick}
                      className={cn("font-semibold", {
                        "text-destructive": option.destructive,
                      })}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default Header;
