"use client";

import SidebarWrapper from "@/components/shared/sidebar/SidebarWrapper";
import React, { PropsWithChildren } from "react";
import { Authenticated } from "convex/react";

type Props = PropsWithChildren;

const RootLayout = ({ children }: Props) => {
  return (
    <Authenticated>
      <SidebarWrapper>{children}</SidebarWrapper>
    </Authenticated>
  );
};

export default RootLayout;
