import Image from "next/image";
import React from "react";

type Props = {
  size?: number;
};

const LoadingLogo = ({ size = 100 }: Props) => {
  return (
    <div className="grid place-items-center h-dvh">
      <Image
        src={"/logo.svg"}
        width={size}
        height={size}
        alt="Loading logo"
        className="animate-pulse duration-700"
      />
    </div>
  );
};

export default LoadingLogo;
