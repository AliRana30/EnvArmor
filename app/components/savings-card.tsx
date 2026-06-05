"use client";

import html2canvas from "html2canvas";
import { useMemo, useRef, useState } from "react";

type SavingsCardProps = {
  totalSaved: number;
  secretsBlocked: number;
  topSecretType: string;
  memberSince: string;
  username: string;
};

export function SavingsCard({ totalSaved, secretsBlocked, topSecretType, memberSince, username }: SavingsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(totalSaved),
    [totalSaved]
  );

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = "envarmor-savings-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const tweetText = encodeURIComponent(
    `EnvArmor has saved @${username} an estimated ${formattedAmount} by blocking ${secretsBlocked} secrets. Top secret type: ${topSecretType}.`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">EnvArmor Savings</p>
        <h3 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
          EnvArmor has saved @{username} an estimated {formattedAmount}
        </h3>
        <p className="mt-4 max-w-lg text-sm text-slate-300">
          {secretsBlocked} secrets blocked. Top detected type: {topSecretType}. Member since {new Date(memberSince).toLocaleDateString()}.
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          Credited to the IBM Cost of Data Breach Report 2025 methodology and EnvArmor severity/blocking multipliers.
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {exporting ? "Exporting..." : "Download as PNG"}
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
        >
          Share to Twitter/X
        </a>
      </div>
    </div>
  );
}
