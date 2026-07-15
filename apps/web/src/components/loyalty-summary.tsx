"use client";

import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import { TrophyIcon, AwardIcon, StarIcon, TrendingUpIcon, CoinsIcon } from "lucide-react";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; Icon: any; iconColor: string }> = {
  gold:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  Icon: TrophyIcon, iconColor: "text-amber-500" },
  silver: { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-300",  Icon: AwardIcon,  iconColor: "text-slate-400" },
  bronze: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", Icon: StarIcon,   iconColor: "text-orange-500" },
};

const TIER_THRESHOLDS = { gold: 50000, silver: 10000, bronze: 0 };

interface LoyaltySummaryProps {
  customerId: number;
}

export function LoyaltySummary({ customerId }: LoyaltySummaryProps) {
  const { data, isLoading } = trpc.loyalty.getCustomerLoyalty.useQuery({ customer_id: customerId });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading loyalty data...</div>;
  if (!data?.customer) return null;

  const { customer, history } = data;
  const tier = (customer.loyalty_tier ?? "bronze") as "bronze" | "silver" | "gold";
  const tierStyle = TIER_COLORS[tier];
  const { Icon: TierIcon, iconColor } = tierStyle;
  const totalSpent = parseFloat(customer.total_spent as string ?? "0");

  const nextTier = tier === "bronze" ? "silver" : tier === "silver" ? "gold" : null;
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const progress = nextThreshold ? Math.min((totalSpent / nextThreshold) * 100, 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-xl border p-5 ${tierStyle.bg} ${tierStyle.border}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Loyalty Account
          </h3>
          <p className={`text-xs mt-0.5 ${tierStyle.text}`}>Member since {new Date(customer.created_at as string).toLocaleDateString()}</p>
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}
        >
          <TierIcon className={`h-4 w-4 ${iconColor}`} />
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </motion.span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{customer.loyalty_points ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Points Available</div>
          <div className="text-xs font-medium mt-1">= ₹{customer.loyalty_points ?? 0} discount</div>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">₹{parseFloat(customer.total_spent as string ?? "0").toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Spent</div>
          {nextTier && <div className="text-xs font-medium mt-1 text-blue-600">₹{(nextThreshold! - totalSpent).toLocaleString("en-IN")} to {nextTier}</div>}
        </div>
      </div>

      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="capitalize font-medium">{tier}</span>
            <span className="capitalize font-medium">{nextTier}</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUpIcon className="h-3.5 w-3.5" /> Recent Activity
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {history.map((entry: any, i: number) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex justify-between items-center text-xs bg-white/60 rounded px-2 py-1"
              >
                <span className="text-muted-foreground truncate flex-1">{entry.reason}</span>
                <span className={`font-bold ml-2 ${entry.points_change > 0 ? "text-green-600" : "text-red-600"}`}>
                  {entry.points_change > 0 ? "+" : ""}{entry.points_change}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
