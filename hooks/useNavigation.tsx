import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessagesSquareIcon, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const useNavigation = () => {
  const pathName = usePathname();

  const requestsCount = useQuery(api.requests.count);
  const conversations = useQuery(api.conversations.get);

  const unseenMessagesCount = useMemo(() => {
    return conversations?.reduce((acc, curr) => {
      return acc + curr.unseenCount;
    }, 0);
  }, [conversations]);

  const paths = useMemo(
    () => [
      {
        name: "Conversations",
        href: "/conversations",
        icon: <MessagesSquareIcon />,
        active: pathName.startsWith("/conversations"),
        count: unseenMessagesCount,
      },
      {
        name: "Friends",
        href: "/friends",
        icon: <Users />,
        active: pathName.startsWith("/friends"),
        count: requestsCount,
      },
    ],
    [pathName, requestsCount, unseenMessagesCount]
  );

  return paths;
};
