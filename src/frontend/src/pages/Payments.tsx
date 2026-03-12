import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_creditCard_homeLoan_investment_insurance_savings_current as AccType } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useActor } from "../hooks/useActor";
import { formatCurrency } from "../lib/utils";

const PAYMENT_TARGETS = [AccType.creditCard, AccType.homeLoan];
const PAYMENT_SOURCES = [AccType.savings, AccType.current];

const TYPE_LABEL: Record<string, string> = {
  creditCard: "Credit Card",
  homeLoan: "Home Loan",
  savings: "Savings",
  current: "Current",
};

export default function Payments() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const [targetAccountId, setTargetAccountId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => actor!.listAccounts(),
    enabled: !!actor,
  });

  const targetAccount = accounts.find((a) => a.accountId === targetAccountId);
  const sourceAccount = accounts.find((a) => a.accountId === sourceAccountId);

  const paymentMut = useMutation({
    mutationFn: () =>
      actor!.processPayment({
        sourceAccountId,
        targetAccountId,
        amount: BigInt(Math.round(Number.parseFloat(amount) * 100)),
        description: `Payment to ${targetAccount ? TYPE_LABEL[targetAccount.accountType] : "account"} ${targetAccount?.accountNumber}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Payment processed successfully");
      setConfirmOpen(false);
      setTargetAccountId("");
      setSourceAccountId("");
      setAmount("");
    },
    onError: () => {
      toast.error("Payment failed. Check your balance.");
      setConfirmOpen(false);
    },
  });

  const targetAccounts = accounts.filter((a) =>
    PAYMENT_TARGETS.includes(a.accountType),
  );
  const sourceAccounts = accounts.filter((a) =>
    PAYMENT_SOURCES.includes(a.accountType),
  );

  const amountNum = Number.parseFloat(amount);
  const amountPaise = amountNum ? BigInt(Math.round(amountNum * 100)) : 0n;
  const insufficientBalance =
    sourceAccount && amountPaise > sourceAccount.balance;
  const isValid =
    targetAccountId && sourceAccountId && amountNum > 0 && !insufficientBalance;

  return (
    <div data-ocid="payments.page" className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Make Payment</h2>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 space-y-5">
          <div>
            <p className="text-sm font-medium mb-1.5">Pay For</p>
            <Select value={targetAccountId} onValueChange={setTargetAccountId}>
              <SelectTrigger data-ocid="payments.target.select">
                <SelectValue placeholder="Select Credit Card / Home Loan account" />
              </SelectTrigger>
              <SelectContent>
                {targetAccounts.map((a) => (
                  <SelectItem key={a.accountId} value={a.accountId}>
                    {TYPE_LABEL[a.accountType]} — {a.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No Credit Card or Home Loan accounts found.
              </p>
            )}
          </div>

          {targetAccount && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Account</span>
                <span className="font-medium">
                  {targetAccount.accountNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">
                  {TYPE_LABEL[targetAccount.accountType]}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Outstanding Balance
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(targetAccount.balance)}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-1.5">Pay From</p>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger data-ocid="payments.source.select">
                <SelectValue placeholder="Select Savings / Current account" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((a) => (
                  <SelectItem key={a.accountId} value={a.accountId}>
                    {TYPE_LABEL[a.accountType]} — {a.accountNumber} (
                    {formatCurrency(a.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceAccount && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {formatCurrency(sourceAccount.balance)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="payment-amount"
              className="text-sm font-medium mb-1.5 block"
            >
              Amount (₹)
            </label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              data-ocid="payments.amount.input"
            />
            {insufficientBalance && (
              <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                <AlertTriangle className="w-3 h-3" />
                <p className="text-xs">
                  Insufficient balance in selected account.
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!isValid}
            data-ocid="payments.submit_button"
            onClick={() => setConfirmOpen(true)}
          >
            Review Payment <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => !v && setConfirmOpen(false)}
      >
        <DialogContent data-ocid="payments.confirm.dialog">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please review before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay to:</span>
                <span className="font-medium">
                  {targetAccount
                    ? `${TYPE_LABEL[targetAccount.accountType]} (${targetAccount.accountNumber})`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium">
                  {sourceAccount
                    ? `${TYPE_LABEL[sourceAccount.accountType]} (${sourceAccount.accountNumber})`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary">
                  ₹{Number.parseFloat(amount || "0").toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-ocid="payments.confirm.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => paymentMut.mutate()}
              disabled={paymentMut.isPending}
              data-ocid="payments.confirm_button"
            >
              {paymentMut.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
