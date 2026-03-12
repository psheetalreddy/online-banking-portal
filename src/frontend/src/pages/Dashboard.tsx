import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Page } from "../App";
import { Variant_disputed_pending_completed } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { formatCurrency, formatDate } from "../lib/utils";

interface Props {
  onNavigate: (page: Page) => void;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  disputed: "bg-red-100 text-red-700",
};

export default function Dashboard({ onNavigate }: Props) {
  const { actor } = useActor();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => actor!.getDashboardSummary(),
    enabled: !!actor,
  });

  if (isLoading) {
    return (
      <div data-ocid="dashboard.page" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalBalance = summary?.totalBalance ?? 0n;
  const accountCount = summary?.accountCount ?? 0n;
  const unreadCount = summary?.unreadMessageCount ?? 0n;
  const recentTxns = summary?.recentTransactions ?? [];

  return (
    <div data-ocid="dashboard.page" className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary to-[oklch(0.38_0.18_250)] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Total Balance</span>
              <Wallet className="w-5 h-5 text-white/70" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-white/60 text-xs mt-1">
              Across all accounts
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">
                Total Accounts
              </span>
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Number(accountCount)}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-primary mt-1"
              onClick={() => onNavigate("accounts")}
            >
              View all <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">
                Unread Messages
              </span>
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Number(unreadCount)}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-primary mt-1"
              onClick={() => onNavigate("messages")}
            >
              View messages <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recent Transactions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => onNavigate("transactions")}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {recentTxns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((txn, i) => (
                <div
                  key={txn.transactionId}
                  data-ocid={`dashboard.transaction.item.${i + 1}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {txn.description || "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(txn.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge
                      className={
                        STATUS_STYLES[txn.status] ?? "bg-gray-100 text-gray-700"
                      }
                      variant="outline"
                    >
                      {txn.status}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
