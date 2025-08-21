"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/theme/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConversations } from "@/hooks/useConversations";
import { useNavigation } from "@/hooks/useNavigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

const MobileNav = () => {
  const paths = useNavigation();
  const { isActive } = useConversations();

  if (isActive) return null;

  return (
    <Card className="fixed bottom-4 w-[calc(100vw-32px)] flex justify-center items-center h-16 p-2 lg:hidden">
      <nav className="w-full">
        <ul className="flex justify-between items-center w-full">
          {paths.map((path, id) => {
            return (
              <li key={id} className="relative flex-1 flex justify-center">
                <Link href={path.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Button
                          size="icon"
                          variant={path.active ? "default" : "outline"}
                        >
                          {path.icon}
                        </Button>
                        {path.count ? (
                          <Badge className="absolute left-6 bottom-7 px-2">
                            {path.count}
                          </Badge>
                        ) : null}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent align="center" side="top">
                      <p>{path.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>
              </li>
            );
          })}
          <li className="relative flex-1 flex justify-center">
            <ModeToggle />
          </li>
          <li className="relative flex-1 flex justify-center">
            <UserButton />
          </li>
        </ul>
      </nav>
    </Card>
  );
};

export default MobileNav;
