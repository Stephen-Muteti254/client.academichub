import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  {
    getElement: () => HTMLDivElement | null;
    scrollTop: () => number;
    scrollHeight: () => number;
    clientHeight: () => number;
  },
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  }
>(({ className, children, onScroll, ...props }, ref) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    getElement: () => viewportRef.current,
    scrollTop: () => viewportRef.current?.scrollTop ?? 0,
    scrollHeight: () => viewportRef.current?.scrollHeight ?? 0,
    clientHeight: () => viewportRef.current?.clientHeight ?? 0,
  }));

  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className="h-full w-full rounded-[inherit]"
        onScroll={onScroll}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = "ScrollArea";

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
