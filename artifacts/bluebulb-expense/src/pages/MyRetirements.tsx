import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetRetirements, useGetExpenses, useCreateRetirement } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Loader2, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MyRetirements() {
  const { user } = useAuth();
  const { data: retirements, isLoading: loadingRet } = useGetRetirements({ requesterId: user?.id });
  const { data: expenses, isLoading: loadingExp } = useGetExpenses();
  const [retireExpense, setRetireExpense] = useState<any>(null);

  const isLoading = loadingRet || loadingExp;

  // Paid expenses that don't yet have a retirement
  const retiredExpenseIds = new Set((retirements || []).map((r: any) => r.expenseId));
  const paidExpenses = (expenses || []).filter(
    (e: any) => e.status === 'paid' && e.requesterId === user?.id && !retiredExpenseIds.has(e.id)
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Retirements</h1>
        <p className="text-muted-foreground mt-1">Submit retirements for paid expenses and track their status.</p>
      </div>

      {paidExpenses.length > 0 && (
        <Card className="border-0 shadow-md shadow-black/5 rounded-2xl overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-display font-semibold text-primary">Expenses Awaiting Retirement</CardTitle>
            <p className="text-sm text-muted-foreground">These expenses have been paid and need to be retired.</p>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-3">
              {paidExpenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">{expense.expenseName}</p>
                    <p className="text-sm text-slate-500">{expense.expenseType} • {format(new Date(expense.requestDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-bold text-slate-700">{formatNaira(expense.amount)}</p>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                      onClick={() => setRetireExpense(expense)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" /> Retire
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg font-display">Retirement History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4 font-semibold text-slate-600">Original Expense</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Amount Given</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Actual Spent</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Balance</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Submitted</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retirements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-500">No retirements yet</p>
                        <p className="text-sm text-slate-400 mt-1">Retire a paid expense using the section above.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  retirements?.map((ret: any) => {
                    const balance = (ret.amount || 0) - (ret.actualAmount || 0);
                    return (
                      <TableRow key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium">{ret.expenseName}</TableCell>
                        <TableCell className="text-slate-600">{formatNaira(ret.amount)}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{formatNaira(ret.actualAmount || ret.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={balance > 0 ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : balance < 0 ? 'text-red-700 border-red-200 bg-red-50' : 'text-slate-600 border-slate-200'}>
                            {balance > 0 ? `+${formatNaira(balance)}` : balance < 0 ? `-${formatNaira(Math.abs(balance))}` : 'Exact'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{format(new Date(ret.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <StatusBadge status={ret.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {retireExpense && (
        <RetireForm
          expense={retireExpense}
          onClose={() => setRetireExpense(null)}
        />
      )}
    </div>
  );
}

function RetireForm({ expense, onClose }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actualAmount, setActualAmount] = useState(expense.amount.toString());
  const [purpose, setPurpose] = useState("");

  const createMutation = useCreateRetirement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/retirements'] });
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        toast({ title: "Retirement Submitted", description: "Your retirement has been submitted for review." });
        onClose();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to submit retirement." });
      }
    }
  });

  const handleSubmit = () => {
    const amount = parseFloat(actualAmount);
    if (!actualAmount || isNaN(amount) || amount < 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid actual amount spent." });
      return;
    }

    createMutation.mutate({
      data: {
        expenseId: expense.id,
        requesterId: user!.id,
        actualAmount: amount,
        purpose: purpose || `Retirement for ${expense.expenseName}`
      }
    });
  };

  const balance = expense.amount - parseFloat(actualAmount || '0');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Submit Retirement</DialogTitle>
          <DialogDescription>{expense.expenseName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Original Amount Given</span>
              <span className="font-bold text-slate-700">{formatNaira(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Purpose</span>
              <span className="font-medium text-slate-700 text-right max-w-[60%]">{expense.purpose}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Actual Amount Spent (₦) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={actualAmount}
              onChange={e => setActualAmount(e.target.value)}
              placeholder="0.00"
              className="bg-slate-50"
            />
          </div>

          {actualAmount && !isNaN(parseFloat(actualAmount)) && (
            <div className={`flex items-center justify-between p-3 rounded-lg border text-sm font-semibold ${
              balance > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              balance < 0 ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span>{balance > 0 ? 'Balance to Return' : balance < 0 ? 'Additional Amount' : 'Exact Spend'}</span>
              <span>{balance !== 0 ? formatNaira(Math.abs(balance)) : '—'}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Retirement Notes <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
            <Textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Describe how the funds were spent..."
              className="resize-none bg-slate-50"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-2">
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Retirement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
