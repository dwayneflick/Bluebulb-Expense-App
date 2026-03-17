import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetExpenses, useCreateExpense, useGetUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira, NIGERIAN_BANKS, EXPENSE_TYPES } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Plus, Eye, Loader2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function MyExpenses() {
  const { user } = useAuth();
  const { data: expenses, isLoading } = useGetExpenses({ requesterId: user?.id });
  const { data: users } = useGetUsers();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState<any>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Expense Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and track your expense applications.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="px-6 py-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              <Plus className="mr-2 h-5 w-5" /> Raise Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Raise New Expense</DialogTitle>
            </DialogHeader>
            <CreateExpenseForm onSuccess={() => setIsCreateOpen(false)} users={users || []} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4 font-semibold text-slate-600">Request Type</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Purpose</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Amount</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Date</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-500">No expenses found</p>
                        <p className="text-sm">You haven't raised any expense requests yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">{expense.expenseType}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-600">{expense.purpose}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{formatNaira(expense.amount)}</TableCell>
                      <TableCell className="text-slate-500">{format(new Date(expense.requestDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewExpense(expense)} className="hover:bg-primary/10 hover:text-primary">
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewExpense} onOpenChange={() => setViewExpense(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display border-b pb-4">Expense Details</DialogTitle>
          </DialogHeader>
          {viewExpense && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewExpense.expenseName}</h3>
                  <p className="text-muted-foreground">{viewExpense.expenseType}</p>
                </div>
                <StatusBadge status={viewExpense.status} className="text-sm px-3 py-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Amount</p>
                  <p className="text-2xl font-bold text-slate-800">{formatNaira(viewExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Request Date</p>
                  <p className="text-lg font-semibold text-slate-800">{format(new Date(viewExpense.requestDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Purpose</p>
                <p className="text-slate-700 bg-white p-4 rounded-lg border border-slate-200">{viewExpense.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Bank Name</p>
                  <p className="font-medium text-slate-800">{viewExpense.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Account Info</p>
                  <p className="font-medium text-slate-800">{viewExpense.accountNumber} - {viewExpense.accountName}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-display font-semibold mb-4 text-lg">Approval Timeline</h4>
                <div className="space-y-4">
                  <TimelineStep title="Manager Approval" name={viewExpense.approverName} date={viewExpense.managerApprovalDate} reason={viewExpense.managerRejectionReason} />
                  <TimelineStep title="Internal Control" name={viewExpense.internalControlName} date={viewExpense.internalControlApprovalDate} reason={viewExpense.internalControlRejectionReason} />
                  <TimelineStep title="Finance Manager" name={viewExpense.financeManagerName} date={viewExpense.financeManagerApprovalDate} reason={viewExpense.financeManagerRejectionReason} />
                  <TimelineStep title="Payment" name="Finance Team" date={viewExpense.paidDate} isLast />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineStep({ title, name, date, reason, isLast = false }: any) {
  if (!name) return null;
  const isComplete = !!date;
  const isRejected = !!reason;

  return (
    <div className="flex relative">
      {!isLast && <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${isComplete ? 'bg-primary' : 'bg-slate-200'}`} />}
      <div className={`z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 mt-1 mr-4 ${
        isRejected ? 'bg-red-500 border-red-500' : 
        isComplete ? 'bg-primary border-primary' : 'bg-white border-slate-300'
      }`}>
        {isComplete && !isRejected && <CheckCircle2 className="w-4 h-4 text-white" />}
        {isRejected && <XCircle className="w-4 h-4 text-white" />}
      </div>
      <div className="pb-6">
        <p className="font-semibold text-slate-800">{title} <span className="text-slate-500 font-normal text-sm ml-2">({name})</span></p>
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

function CreateExpenseForm({ onSuccess, users }: { onSuccess: () => void, users: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({ title: "Success", description: "Expense request created successfully." });
        onSuccess();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create expense." });
      }
    }
  });

  const [formData, setFormData] = useState({
    expenseName: "",
    expenseType: "",
    purpose: "",
    otherInfo: "",
    approverId: "",
    internalControlId: "",
    financeManagerId: "",
    requestDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    amount: ""
  });

  const handleSubmit = (status: "draft" | "pending_manager") => {
    if (!formData.expenseName || !formData.expenseType || !formData.amount || !formData.approverId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields." });
      return;
    }

    createMutation.mutate({
      data: {
        ...formData,
        requesterId: user!.id,
        department: user!.department,
        approverId: parseInt(formData.approverId),
        internalControlId: formData.internalControlId ? parseInt(formData.internalControlId) : undefined,
        financeManagerId: formData.financeManagerId ? parseInt(formData.financeManagerId) : undefined,
        amount: parseFloat(formData.amount),
        status
      }
    });
  };

  const approvers = users.filter(u => u.role === 'approver_manager');
  const internals = users.filter(u => u.role === 'internal_control');
  const finances = users.filter(u => u.role === 'finance_manager' || u.role === 'admin');

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Expense Name <span className="text-red-500">*</span></Label>
          <Input value={formData.expenseName} onChange={e => setFormData({...formData, expenseName: e.target.value})} placeholder="e.g. Client Meeting Lunch" className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <Label>Expense Type <span className="text-red-500">*</span></Label>
          <Select value={formData.expenseType} onValueChange={v => setFormData({...formData, expenseType: v})}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Purpose <span className="text-red-500">*</span></Label>
          <Textarea value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="Detailed reason for this expense" className="bg-slate-50 min-h-[80px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Other Information <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
          <Textarea value={formData.otherInfo} onChange={e => setFormData({...formData, otherInfo: e.target.value})} placeholder="Any additional context, notes, or breakdown details" className="bg-slate-50 min-h-[60px]" />
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Input value={user?.department || ''} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
        </div>
        <div className="space-y-2">
          <Label>Name of Requester</Label>
          <Input value={user?.name || ''} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
        </div>

        <div className="space-y-2">
          <Label>Amount (₦) <span className="text-red-500">*</span></Label>
          <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <Label>Request Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <Label>Due Date <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
          <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="bg-slate-50" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <h4 className="font-semibold text-lg border-b pb-2 mt-4 mb-2">Routing & Approval</h4>
        </div>

        <div className="space-y-2">
          <Label>Manager Approver <span className="text-red-500">*</span></Label>
          <Select value={formData.approverId} onValueChange={v => setFormData({...formData, approverId: v})}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select manager" /></SelectTrigger>
            <SelectContent>
              {approvers.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Internal Control (Optional)</Label>
          <Select value={formData.internalControlId} onValueChange={v => setFormData({...formData, internalControlId: v})}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select internal control" /></SelectTrigger>
            <SelectContent>
              {internals.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Finance Manager / FC <span className="text-red-500">*</span></Label>
          <Select value={formData.financeManagerId} onValueChange={v => setFormData({...formData, financeManagerId: v})}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select finance manager" /></SelectTrigger>
            <SelectContent>
              {finances.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <h4 className="font-semibold text-lg border-b pb-2 mt-4 mb-2">Bank Information</h4>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Bank Name <span className="text-red-500">*</span></Label>
          <Select value={formData.bankName} onValueChange={v => setFormData({...formData, bankName: v})}>
            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>
              {NIGERIAN_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Account Number <span className="text-red-500">*</span></Label>
          <Input maxLength={10} value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g,'')})} placeholder="10 digit number" className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <Label>Account Name <span className="text-red-500">*</span></Label>
          <Input value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} placeholder="Exact name on account" className="bg-slate-50" />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={createMutation.isPending} className="py-6 px-6 rounded-xl">
          Save for Later
        </Button>
        <Button onClick={() => handleSubmit("pending_manager")} disabled={createMutation.isPending} className="py-6 px-8 rounded-xl shadow-lg shadow-primary/20">
          {createMutation.isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
          Raise Expense Now
        </Button>
      </div>
    </div>
  );
}
