"use client";

import * as NProgress from "nprogress";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function BackForthButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-row gap-1 mr-1 md:gap-2 md:mr-2">
      <button
        onClick={() => {
          NProgress.start();
          router.back();
        }}
        className="bg-white dark:bg-darkTwo basic-border center-col text-dark transition hover:bg-primary hover:text-white hover:border-primary size-9 md:size-10"
      >
        <ChevronLeft className="dark:text-support size-5 md:size-6" />
      </button>
      <button
        onClick={() => {
          NProgress.start();
          router.forward();
        }}
        className="bg-white dark:bg-darkTwo basic-border center-col text-dark transition hover:bg-primary hover:text-white hover:border-primary size-9 md:size-10"
      >
        <ChevronRight className="dark:text-support size-5 md:size-6" />
      </button>
    </div>
  );
}
