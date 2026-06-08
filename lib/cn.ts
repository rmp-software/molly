import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom font-size and shadow tokens so that
// conflicting classes are de-duped by class order, not CSS source order.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },
      ],
      shadow: [{ shadow: ["xs", "sm", "md", "lg", "brand", "focus"] }],
    },
  },
});

/** Merge conditional class names, resolving conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
