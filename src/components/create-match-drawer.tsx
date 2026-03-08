"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MatchForm } from "./match-form";
import type { Match } from "@/types/match";

interface CreateMatchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated: (match: Match) => void;
}

export function CreateMatchDrawer({
  open,
  onOpenChange,
  onMatchCreated,
}: CreateMatchDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      handleOnly
      shouldScaleBackground
      disablePreventScroll={false}
    >
      <DrawerContent className="mt-0 h-[100dvh] max-h-[100dvh] overflow-hidden rounded-none">
        <DrawerHeader className="shrink-0 border-b px-4 pb-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DrawerTitle>Add match</DrawerTitle>
              <DrawerDescription>
                Enter teams, final scores, and checkpoints in a full-screen
                editor.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <MatchForm
            onSubmit={onMatchCreated}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
