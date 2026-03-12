import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Payee } from "../backend";
import { Variant_creditCard_homeLoan_investment_insurance_savings_current as AccType } from "../backend";
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
import { Switch } from "../components/ui/switch";
import { useActor } from "../hooks/useActor";
import { formatCurrency, generateId } from "../lib/utils";

const ELIGIBLE_SOURCE = [AccType.savings, AccType.current];

export default function Transfer() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const [fromAccountId, setFromAccountId] = useState("");
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [standingInstruction, setStandingInstruction] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [occurrences, setOccurrences] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [addPayeeOpen, setAddPayeeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [payeeName, setPayeeName] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [ifsc, setIfsc] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => actor!.listAccounts(),
    enabled: !!actor,
  });

  const { data: payees = [] } = useQuery({
    queryKey: ["payees"],
    queryFn: () => actor!.listPayees(),
    enabled: !!actor,
  });

  const addPayeeMut = useMutation({
    mutationFn: (p: Payee) => actor!.addPayee(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payees"] });
      toast.success("Payee added");
      setAddPayeeOpen(false);
      setPayeeName("");
      setBankName("");
      setBranchName("");
      setPayeeAccount("");
      setIfsc("");
    },
    onError: () => toast.error("Failed to add payee"),
  });

  const transferMut = useMutation({
    mutationFn: () =>
      actor!.fundTransfer({
        fromAccountId,
        toAccountId: selectedPayeeId,
        amount: BigInt(Math.round(Number.parseFloat(amount) * 100)),
        description: description || "Fund Transfer",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Transfer initiated successfully");
      setConfirmOpen(false);
      setFromAccountId("");
      setSelectedPayeeId("");
      setAmount("");
      setDescription("");
    },
    onError: () => {
      toast.error("Transfer failed. Check your balance.");
      setConfirmOpen(false);
    },
  });

  const handleAddPayee = () => {
    if (!payeeName || !bankName || !branchName || !payeeAccount || !ifsc) {
      toast.error("Please fill all payee fields");
      return;
    }
    addPayeeMut.mutate({
      payeeId: generateId(),
      payeeName,
      bankName,
      branchName,
      accountNumber: payeeAccount,
      ifsc,
    });
  };

  const sourceAccounts = accounts.filter((a) =>
    ELIGIBLE_SOURCE.includes(a.accountType),
  );
  const selectedFrom = accounts.find((a) => a.accountId === fromAccountId);
  const confirmedPayee = payees.find((p) => p.payeeId === selectedPayeeId);
  const amountNum = Number.parseFloat(amount);
  const isValid = fromAccountId && selectedPayeeId && amountNum > 0;

  return (
    <div data-ocid="transfer.page" className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Fund Transfer</h2>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 space-y-5">
          <div>
            <p className="text-sm font-medium mb-1.5">From Account</p>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger data-ocid="transfer.from_account.select">
                <SelectValue placeholder="Select source account (Savings/Current)" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((a) => (
                  <SelectItem key={a.accountId} value={a.accountId}>
                    {a.accountType === AccType.savings ? "Savings" : "Current"}{" "}
                    — {a.accountNumber} ({formatCurrency(a.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFrom && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {formatCurrency(selectedFrom.balance)}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium">To Payee</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-7"
                data-ocid="transfer.add_payee.button"
                onClick={() => setAddPayeeOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Payee
              </Button>
            </div>
            <Select value={selectedPayeeId} onValueChange={setSelectedPayeeId}>
              <SelectTrigger data-ocid="transfer.payee.select">
                <SelectValue placeholder="Select payee" />
              </SelectTrigger>
              <SelectContent>
                {payees.map((p) => (
                  <SelectItem key={p.payeeId} value={p.payeeId}>
                    {p.payeeName} — {p.bankName} ({p.accountNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {payees.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No payees saved. Add a payee first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="transfer-amount"
                className="text-sm font-medium mb-1.5 block"
              >
                Amount (₹)
              </label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                data-ocid="transfer.amount.input"
              />
            </div>
            <div>
              <label
                htmlFor="transfer-desc"
                className="text-sm font-medium mb-1.5 block"
              >
                Description
              </label>
              <Input
                id="transfer-desc"
                placeholder="e.g. Rent payment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-ocid="transfer.description.input"
              />
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Standing Instruction</p>
                <p className="text-xs text-muted-foreground">
                  Set up a recurring transfer
                </p>
              </div>
              <Switch
                checked={standingInstruction}
                onCheckedChange={setStandingInstruction}
              />
            </div>
            {standingInstruction && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-medium mb-1">Frequency</p>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="si-occ"
                    className="text-xs font-medium mb-1 block"
                  >
                    Occurrences
                  </label>
                  <Input
                    id="si-occ"
                    className="h-8 text-xs"
                    type="number"
                    min="1"
                    value={occurrences}
                    onChange={(e) => setOccurrences(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="si-date"
                    className="text-xs font-medium mb-1 block"
                  >
                    Start Date
                  </label>
                  <Input
                    id="si-date"
                    className="h-8 text-xs"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!isValid}
            data-ocid="transfer.submit_button"
            onClick={() => setConfirmOpen(true)}
          >
            Review Transfer <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addPayeeOpen} onOpenChange={setAddPayeeOpen}>
        <DialogContent data-ocid="transfer.add_payee.dialog">
          <DialogHeader>
            <DialogTitle>Add New Payee</DialogTitle>
            <DialogDescription>
              Enter the payee's bank details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              {
                id: "payee-name",
                label: "Payee Name",
                val: payeeName,
                set: setPayeeName,
                ph: "Full name",
              },
              {
                id: "payee-bank",
                label: "Bank Name",
                val: bankName,
                set: setBankName,
                ph: "e.g. State Bank of India",
              },
              {
                id: "payee-branch",
                label: "Branch Name",
                val: branchName,
                set: setBranchName,
                ph: "e.g. Andheri West",
              },
              {
                id: "payee-acct",
                label: "Account Number",
                val: payeeAccount,
                set: setPayeeAccount,
                ph: "Account number",
              },
              {
                id: "payee-ifsc",
                label: "IFSC Code",
                val: ifsc,
                set: setIfsc,
                ph: "e.g. SBIN0001234",
              },
            ].map(({ id, label, val, set, ph }) => (
              <div key={id}>
                <label htmlFor={id} className="text-xs font-medium mb-1 block">
                  {label}
                </label>
                <Input
                  id={id}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPayeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayee} disabled={addPayeeMut.isPending}>
              {addPayeeMut.isPending ? "Adding..." : "Add Payee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => !v && setConfirmOpen(false)}
      >
        <DialogContent data-ocid="transfer.confirm.dialog">
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              Please review before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>{" "}
                <span className="font-medium">
                  {selectedFrom?.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>{" "}
                <span className="font-medium">
                  {confirmedPayee?.payeeName} ({confirmedPayee?.accountNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>{" "}
                <span className="font-bold text-primary">
                  ₹{Number.parseFloat(amount || "0").toFixed(2)}
                </span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Note:</span>{" "}
                  <span>{description}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-ocid="transfer.confirm.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => transferMut.mutate()}
              disabled={transferMut.isPending}
              data-ocid="transfer.confirm_button"
            >
              {transferMut.isPending ? "Processing..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
