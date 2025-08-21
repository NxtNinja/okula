"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/hooks/useMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { CirclePlusIcon, X, Users } from "lucide-react";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const createGroupFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  members: z
    .string()
    .array()
    .min(1, { message: "At least one member is required" }),
});

const CreateGroupDialog = () => {
  const friends = useQuery(api.friends.get);

  const { mutate: createGroup, pending } = useMutationState(
    api.friends.createGroup
  );

  const form = useForm<z.infer<typeof createGroupFormSchema>>({
    defaultValues: {
      name: "",
      members: [],
    },
    resolver: zodResolver(createGroupFormSchema),
  });

  const members = form.watch("members", []);

  const unselectedFriends = useMemo(() => {
    return friends
      ? friends.filter((friend) => !members.includes(friend._id))
      : [];
  }, [members, friends]);

  const onSubmit = async (data: z.infer<typeof createGroupFormSchema>) => {
    await createGroup({
      name: data.name,
      members: data.members,
    })
      .then(() => {
        form.reset();
        toast.success("Group created successfully");
      })
      .catch((error) => {
        toast.error(
          error instanceof ConvexError
            ? error.data
            : "Unexpected error occurred"
        );
      });
  };

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size={"icon"}
              variant={"outline"}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <CirclePlusIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create group</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5" />
            Create Group
          </DialogTitle>
          <DialogDescription>Add your friends to get started</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Group name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter group name..."
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="members"
              render={() => {
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Add friends
                    </FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          disabled={unselectedFriends.length === 0}
                        >
                          <Button
                            className="w-full h-10 justify-start"
                            variant={"outline"}
                          >
                            <CirclePlusIcon className="w-4 h-4 mr-2" />
                            {unselectedFriends.length === 0
                              ? "All friends added"
                              : "Select friends"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60">
                          {unselectedFriends.map((friend) => {
                            return (
                              <DropdownMenuCheckboxItem
                                key={friend._id}
                                className="flex items-center gap-3 p-3"
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    form.setValue("members", [
                                      ...members,
                                      friend._id,
                                    ]);
                                  }
                                }}
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={friend.imageUrl} />
                                  <AvatarFallback className="text-sm">
                                    {friend.username.substring(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate font-medium">
                                  {friend.username}
                                </span>
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {members && members.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected ({members.length})
                </p>
                <Card className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {friends
                      ?.filter((friend) => members.includes(friend._id))
                      .map((friend) => {
                        return (
                          <div
                            key={friend._id}
                            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={friend.imageUrl} />
                              <AvatarFallback className="text-xs">
                                {friend.username.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate max-w-20">
                              {friend.username.split(" ")[0]}
                            </span>
                            <button
                              type="button"
                              className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                form.setValue(
                                  "members",
                                  members.filter((id) => id !== friend._id)
                                )
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button disabled={pending} type="submit" className="w-full">
                {pending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
