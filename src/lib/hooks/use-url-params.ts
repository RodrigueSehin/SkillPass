"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Filters live in the URL, so views are shareable and pages stay Server Components. */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  return { params, set, reset: () => router.replace(pathname, { scroll: false }) };
}
