import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetExpenses, useApproveExpense, useMarkExpensePaid } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Loader2, Check, X, FileCheck2, Eye, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ExpenseApproval() {
  const { user } = useAuth();
  const { data: expenses, isLoading } = useGetExpenses();
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'pay' | 'view' | null>(null);

  const pendingExpenses = expenses?.filter(e => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'approver_manager' && e.status === 'pending_manager' && e.approverId === user.id) return true;
    if (user?.role === 'internal_control' && e.status === 'pending_internal_control' && e.internalControlId === user.id) return true;
    if (user?.role === 'finance_manager' && e.status === 'pending_finance_manager' && e.financeManagerId === user.id) return true;
    if (user?.role === 'finance_team' && e.status === 'pending_payment') return true;
    return false;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  const handleActionClick = (expense: any, action: 'approve' | 'reject' | 'pay' | 'view') => {
    setSelectedExpense(expense);
    setActionType(action);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and process expense requests waiting for your action.</p>
      </div>

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4 font-semibold text-slate-600">Requester</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Expense Info</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Amount</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Stage</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExpenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileCheck2 className="h-16 w-16 text-slate-200 mb-4" />
                        <p className="text-xl font-display font-medium text-slate-600">All caught up!</p>
                        <p className="text-sm mt-1">No expenses are pending your approval right now.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingExpenses?.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{expense.requesterName}</div>
                        <div className="text-xs text-muted-foreground">{expense.department}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">{expense.expenseName}</div>
                        <div className="text-xs text-muted-foreground">{expense.expenseType}</div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">{formatNaira(expense.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => handleActionClick(expense, 'view')}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          {expense.status === 'pending_payment' ? (
                            <Button size="sm" onClick={() => handleActionClick(expense, 'pay')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              Mark Paid
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleActionClick(expense, 'approve')}>
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleActionClick(expense, 'reject')}>
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedExpense && actionType === 'view' && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => { setSelectedExpense(null); setActionType(null); }}
          onAction={(action) => setActionType(action)}
          userRole={user?.role}
        />
      )}

      {selectedExpense && actionType && actionType !== 'view' && (
        <ApprovalModal
          expense={selectedExpense}
          action={actionType}
          onClose={() => { setSelectedExpense(null); setActionType(null); }}
        />
      )}
    </div>
  );
}

function ExpenseDetailModal({ expense, onClose, onAction, userRole }: any) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display border-b pb-4">Expense Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-foreground">{expense.expenseName}</h3>
              <p className="text-muted-foreground">{expense.expenseType}</p>
            </div>
            <StatusBadge status={expense.status} className="text-sm px-3 py-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-medium">Amount Requested</p>
              <p className="text-2xl font-bold text-slate-800">{formatNaira(expense.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Request Date</p>
              <p className="text-lg font-semibold text-slate-800">{format(new Date(expense.requestDate), 'MMM dd, yyyy')}</p>
            </div>
            {expense.dueDate && (
              <div>
                <p className="text-sm text-slate-500 font-medium">Due Date</p>
                <p className="text-lg font-semibold text-slate-800">{format(new Date(expense.dueDate), 'MMM dd, yyyy')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 font-medium">Department</p>
              <p className="text-lg font-semibold text-slate-800">{expense.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Requester</p>
              <p className="font-semibold text-slate-800">{expense.requesterName}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Purpose</p>
            <p className="text-slate-700 bg-white p-4 rounded-lg border border-slate-200">{expense.purpose}</p>
          </div>

          {expense.otherInfo && (
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Other Information</p>
              <p className="text-slate-700 bg-white p-4 rounded-lg border border-slate-200">{expense.otherInfo}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">Bank</p>
              <p className="font-semibold text-slate-800 text-sm">{expense.bankName}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">Account Number</p>
              <p className="font-semibold text-slate-800 text-sm font-mono">{expense.accountNumber}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">Account Name</p>
              <p className="font-semibold text-slate-800 text-sm">{expense.accountName}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-display font-semibold mb-4 text-lg">Approval Timeline</h4>
            <div className="space-y-3">
              <TimelineStep title="Manager Approval" name={expense.approverName} date={expense.managerApprovalDate} reason={expense.managerRejectionReason} />
              <TimelineStep title="Internal Control" name={expense.internalControlName} date={expense.internalControlApprovalDate} reason={expense.internalControlRejectionReason} />
              <TimelineStep title="Finance Manager" name={expense.financeManagerName} date={expense.financeManagerApprovalDate} reason={expense.financeManagerRejectionReason} />
              <TimelineStep title="Payment" name={expense.paidDate ? "Finance Team" : undefined} date={expense.paidDate} isLast />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {expense.status !== 'pending_payment' && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onAction('reject')}>
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button className="bg-primary" onClick={() => onAction('approve')}>
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
              </>
            )}
            {expense.status === 'pending_payment' && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAction('pay')}>
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineStep({ title, name, date, reason, isLast = false }: any) {
  if (!name && !date) return null;
  const isComplete = !!date;
  const isRejected = !!reason;

  return (
    <div className="flex relative">
      {!isLast && <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${isComplete ? 'bg-primary' : 'bg-slate-200'}`} />}
      <div className={`z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 mt-1 mr-4 flex-shrink-0 ${
        isRejected ? 'bg-red-500 border-red-500' :
        isComplete ? 'bg-primary border-primary' : 'bg-white border-slate-300'
      }`}>
        {isComplete && !isRejected && <CheckCircle2 className="w-4 h-4 text-white" />}
        {isRejected && <XCircle className="w-4 h-4 text-white" />}
      </div>
      <div className="pb-4">
        <p className="font-semibold text-slate-800">{title} {name && <span className="text-slate-500 font-normal text-sm ml-1">({name})</span>}</p>
        {date ? (
          <p className="text-sm text-slate-500">{format(new Date(date), 'MMM dd, yyyy HH:mm')}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">Pending</p>
        )}
        {reason && <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">{reason}</p>}
      </div>
    </div>
  );
}

function ApprovalModal({ expense, action, onClose }: any) {
  const [reason, setReason] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useApproveExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({ title: "Success", description: `Expense ${action}d successfully.` });
        onClose();
      }
    }
  });

  const payMutation = useMarkExpensePaid({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({ title: "Success", description: "Expense marked as paid." });
        onClose();
      }
    }
  });

  const handleSubmit = () => {
    if (action === 'reject' && !reason) {
      toast({ variant: "destructive", title: "Required", description: "Please provide a reason for rejection." });
      return;
    }

    if (action === 'pay') {
      payMutation.mutate({
        id: expense.id,
        data: { paidById: user!.id, receiptUrl }
      });
    } else {
      approveMutation.mutate({
        id: expense.id,
        data: {
          action: action as 'approve' | 'reject',
          approverId: user!.id,
          reason
        }
      });
    }
  };

  const isPending = approveMutation.isPending || payMutation.isPending;
  const isDestructive = action === 'reject';
  const title = action === 'approve' ? 'Approve Expense' : action === 'reject' ? 'Reject Expense' : 'Mark as Paid';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{title}</DialogTitle>
          <DialogDescription>
            {expense.expenseName} — {formatNaira(expense.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2 border border-slate-100">
            <div className="flex justify-between"><span className="text-slate-500">Requester</span> <span className="font-medium text-slate-800">{expense.requesterName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Department</span> <span className="font-medium text-slate-800">{expense.department}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Purpose</span> <span className="font-medium text-slate-800 text-right max-w-[60%]">{expense.purpose}</span></div>
            <div className="flex justify-between pt-2 border-t mt-2"><span className="text-slate-500">Bank Details</span> <span className="font-medium text-slate-800">{expense.bankName} — {expense.accountNumber}</span></div>
          </div>

          {action !== 'pay' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Reason / Comments {action === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={`Enter your ${action} reason here...`}
                className="resize-none"
              />
            </div>
          )}

          {action === 'pay' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Receipt Reference <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input
                type="text"
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
                placeholder="Reference number or URL..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : action === 'pay' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm {title.split(' ')[0]}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
