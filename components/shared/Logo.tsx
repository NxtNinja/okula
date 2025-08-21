import Image from "next/image";
import React from "react";

type Props = {
  size?: number;
  className?: string;
};

const Logo = ({ size = 60, className = "" }: Props) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.svg"
        width={size}
        height={size}
        alt="Okula AI"
        className="object-contain"
      />
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Okula AI
      </h1>
    </div>
  );
};

export default Logo;
