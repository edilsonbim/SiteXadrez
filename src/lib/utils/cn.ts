import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating: number) { return Math.round(rating).toString(); }
export function ratingTier(rating: number) {
  if (rating >= 2400) return { name: "Super", color: "#a371f7" };
  if (rating >= 2000) return { name: "Mestre", color: "#f5b041" };
  if (rating >= 1800) return { name: "Candidato", color: "#db6d28" };
  if (rating >= 1600) return { name: "A", color: "#3fb950" };
  if (rating >= 1400) return { name: "B", color: "#58a6ff" };
  if (rating >= 1200) return { name: "C", color: "#9ba6b3" };
  if (rating >= 1000) return { name: "D", color: "#9ba6b3" };
  return { name: "E", color: "#6e7681" };
}
