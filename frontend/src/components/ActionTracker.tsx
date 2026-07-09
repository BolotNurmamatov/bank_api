"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function ActionTracker() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && pathname) {
      // Log the page visit
      fetch("/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "visit_page",
          page_url: pathname,
          details: `User visited ${pathname}`
        })
      }).catch(err => console.error("Failed to log page visit", err));
    }
  }, [pathname, status]);

  return null;
}
