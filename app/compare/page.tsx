import { Suspense } from "react";
import { CompareShell } from "@/components/compare-shell";

export default function ComparePage() {
  return (
    <Suspense>
      <CompareShell />
    </Suspense>
  );
}
