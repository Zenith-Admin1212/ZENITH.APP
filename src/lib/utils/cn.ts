import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes safely — handles conflicts correctly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
