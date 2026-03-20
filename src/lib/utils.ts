import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl() {
  // If in browser, use current origin as primary truth
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_APP_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    process?.env?.VERCEL_PROJECT_PRODUCTION_URL ??
    process?.env?.VERCEL_URL ??
    'http://localhost:3000';

  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
  return url;
}
