import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend";
import {
  Variant_creditCard_homeLoan_investment_insurance_savings_current,
  Variant_disputed_pending_completed,
} from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { formatCurrency, formatDate } from "../lib/utils";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  disputed: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_LABEL: Record<string, string> = {
  transfer: "Transfer",
  payment: "Payment",
};

type FilterPreset = "all" | "last10" | "lastMonth" | "range";

export default function Transactions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [preset, setPreset] = useState<FilterPreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [disputeTarget, setDisputeTarget] = useState<Transaction | null>(null);

  const { data: allTxns = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => actor!.listTransactions(),
    enabled: !!actor,
  });

  const disputeMut = useMutation({
    mutationFn: (id: string) => actor!.disputeTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction disputed");
      setDisputeTarget(null);
    },
    onError: () => toast.error("Failed to dispute"),
  });

  const applyFilter = (txns: Transaction[]): Transaction[] => {
    if (preset === "last10") return txns.slice(0, 10);
    if (preset === "lastMonth") {
      const now = Date.now();
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      return txns.filter((t) => Number(t.date) >= oneMonthAgo);
    }
    if (preset === "range" && fromDate && toDate) {
      const from = new Date(fromDate).getTime();
      const to = new Date(toDate).getTime() + 86400000;
      return txns.filter((t) => Number(t.date) >= from && Number(t.date) <= to);
    }
    return txns;
  };

  const displayed = applyFilter(
    [...allTxns].sort((a, b) => Number(b.date) - Number(a.date)),
  );

  return (
    <div data-ocid="transactions.page" className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction History</h2>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-2 items-center"
        data-ocid="transactions.filter.tab"
      >
        {(["all", "last10", "lastMonth", "range"] as FilterPreset[]).map(
          (p) => (
            <Button
              key={p}
              variant={preset === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPreset(p)}
            >
              {p === "all"
                ? "All"
                : p === "last10"
                  ? "Last 10"
                  : p === "lastMonth"
                    ? "Last Month"
                    : "Date Range"}
            </Button>
          ),
        )}
        {preset === "range" && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-36"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-36"
            />
          </div>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {displayed.length} transactions
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No transactions found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {displayed.map((txn, i) => (
                <div
                  key={txn.transactionId}
                  data-ocid={`transactions.item.${i + 1}`}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {txn.description || "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(txn.date)} ·{" "}
                      {TYPE_LABEL[txn.transactionType] ?? txn.transactionType}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[txn.status] ?? ""}
                    >
                      {txn.status}
                    </Badge>
                    <span className="text-sm font-semibold min-w-[80px] text-right">
                      {formatCurrency(txn.amount)}
                    </span>
                    {txn.status !==
                      Variant_disputed_pending_completed.disputed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        data-ocid={`transactions.dispute_button.${i + 1}`}
                        onClick={() => setDisputeTarget(txn)}
                      >
                        Dispute
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute dialog */}
      <Dialog
        open={!!disputeTarget}
        onOpenChange={(v) => !v && setDisputeTarget(null)}
      >
        <DialogContent data-ocid="transactions.dispute.dialog">
          <DialogHeader>
            <DialogTitle>Raise Dispute</DialogTitle>
            <DialogDescription>
              Are you sure you want to raise a dispute for the transaction of{" "}
              {disputeTarget ? formatCurrency(disputeTarget.amount) : ""}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeTarget(null)}
              data-ocid="transactions.dispute.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                disputeTarget && disputeMut.mutate(disputeTarget.transactionId)
              }
              disabled={disputeMut.isPending}
              data-ocid="transactions.dispute.confirm_button"
            >
              {disputeMut.isPending ? "Submitting..." : "Confirm Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
