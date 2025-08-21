import React, { PropsWithChildren } from "react";
import DesktopNav from "./nav/DesktopNav";
import MobileNav from "./nav/MobileNav";

type Props = PropsWithChildren;

const SidebarWrapper = ({ children }: Props) => {
  return (
    <div className="h-screen w-full p-4 flex flex-col lg:flex-row lg:gap-4 gap-0 overflow-hidden">
      <MobileNav />
      <DesktopNav />
      <main className="flex-1 flex lg:gap-4 gap-0 w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default SidebarWrapper;
