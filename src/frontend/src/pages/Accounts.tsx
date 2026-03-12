import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Account } from "../backend";
import { Variant_creditCard_homeLoan_investment_insurance_savings_current } from "../backend";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
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
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { formatCurrency, generateId } from "../lib/utils";

const ACCOUNT_TYPES = [
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.savings,
    label: "Savings",
  },
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.current,
    label: "Current",
  },
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.creditCard,
    label: "Credit Card",
  },
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.homeLoan,
    label: "Home Loan",
  },
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.investment,
    label: "Investment",
  },
  {
    value:
      Variant_creditCard_homeLoan_investment_insurance_savings_current.insurance,
    label: "Insurance",
  },
];

function groupByType(accounts: Account[]): Record<string, Account[]> {
  const groups: Record<string, Account[]> = {};
  for (const acc of accounts) {
    const t = acc.accountType;
    if (!groups[t]) groups[t] = [];
    groups[t].push(acc);
  }
  return groups;
}

export default function Accounts() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState("");
  const [newNumber, setNewNumber] = useState("");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => actor!.listAccounts(),
    enabled: !!actor,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Account deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete account"),
  });

  const addMut = useMutation({
    mutationFn: (acc: Account) => actor!.addAccount(acc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Account added");
      setAddOpen(false);
      setNewType("");
      setNewNumber("");
    },
    onError: () => toast.error("Failed to add account"),
  });

  const handleAdd = () => {
    if (!newType || !newNumber.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    addMut.mutate({
      accountId: generateId(),
      accountType:
        newType as Variant_creditCard_homeLoan_investment_insurance_savings_current,
      accountNumber: newNumber.trim(),
      balance: 0n,
      status: "active",
      createdAt: BigInt(Date.now()),
    });
  };

  const grouped = groupByType(accounts);

  return (
    <div data-ocid="accounts.page" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Accounts</h2>
        <Button
          size="sm"
          data-ocid="accounts.add.button"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No accounts yet. Add your first account to get started.
            </p>
            <Button
              onClick={() => setAddOpen(true)}
              data-ocid="accounts.add.button"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {ACCOUNT_TYPES.map(({ value, label }) => {
            const typeAccounts = grouped[value] || [];
            return (
              <AccordionItem
                key={value}
                value={value}
                className="border border-border rounded-xl overflow-hidden bg-white shadow-sm"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <span className="font-medium">{label}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {typeAccounts.length} account
                      {typeAccounts.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4">
                  {typeAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No {label} accounts linked.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {typeAccounts.map((acc, i) => (
                        <div
                          key={acc.accountId}
                          data-ocid={`accounts.item.${i + 1}`}
                          className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              Acct: {acc.accountNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(acc.balance)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDetail(true)}
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              data-ocid={`accounts.delete_button.${i + 1}`}
                              onClick={() => setDeleteTarget(acc)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="accounts.add.dialog">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Link a new bank account to your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-1.5">Account Type</p>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-ocid="accounts.type.select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="acct-number"
                className="text-sm font-medium mb-1.5 block"
              >
                Account Number
              </label>
              <Input
                id="acct-number"
                placeholder="Enter account number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                data-ocid="accounts.number.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="accounts.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMut.isPending}
              data-ocid="accounts.add.submit_button"
            >
              {addMut.isPending ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="accounts.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete account{" "}
              {deleteTarget?.accountNumber}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="accounts.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMut.mutate(deleteTarget.accountId)
              }
              disabled={deleteMut.isPending}
              data-ocid="accounts.delete.confirm_button"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent data-ocid="accounts.detail.dialog">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">🚧</div>
            <p className="font-semibold text-foreground">
              Feature Under Construction
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Detailed account view will be available in a future sprint.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowDetail(false)}
              data-ocid="accounts.detail.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
