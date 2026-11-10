"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badgeText: string;
  badgeColor?: string;
  subtitle: string;
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[#3ECF8E]",
  iconBg = "bg-[#3ECF8E]/10 border-[#3ECF8E]/20",
  badgeText,
  badgeColor = "bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20",
  subtitle,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#161817] p-5 shadow-sm transition-all hover:border-white/20">
      {/* Top row: Title and Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        <div
          className={`flex size-8 items-center justify-center rounded-xl border ${iconBg} ${iconColor}`}
        >
          <Icon className="size-4" />
        </div>
      </div>

      {/* Main big metric value */}
      <div className="my-3">
        <h3 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
          {value}
        </h3>
      </div>

      {/* Bottom row: Pill Badge + Description text */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badgeColor}`}
        >
          {badgeText}
        </span>
        <span className="truncate text-zinc-500">{subtitle}</span>
      </div>
    </div>
  );
}
