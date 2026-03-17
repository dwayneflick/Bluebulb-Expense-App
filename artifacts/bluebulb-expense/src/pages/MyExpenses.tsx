import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetExpenses, useCreateExpense, useGetUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira, NIGERIAN_BANKS, EXPENSE_TYPES, DEPARTMENTS, SBUS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Plus, Eye, Loader2, FileText, CheckCircle2, XCircle, Paperclip, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const BASE_API = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_URL = BASE_API ? `${BASE_API.replace(/\/__/, "/api-server")}` : "/api-server";

function getFileUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const apiBase = window.location.origin;
  const port = window.location.port === "80" || !window.location.port ? "8080" : "8080";
  return `${window.location.protocol}//${window.location.hostname}:${port}${path}`;
}

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
                  <TableHead className="py-4 font-semibold text-slate-600">Expense Name</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Type</TableHead>
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
                      <TableCell className="font-medium text-slate-800">{expense.expenseName}</TableCell>
                      <TableCell className="text-slate-600">{expense.expenseType}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{formatNaira(expense.amount)}</TableCell>
                      <TableCell className="text-slate-500">{format(new Date(expense.requestDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell><StatusBadge status={expense.status} /></TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display border-b pb-4">Expense Details</DialogTitle>
          </DialogHeader>
          {viewExpense && (
            <div className="space-y-5 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewExpense.expenseName}</h3>
                  <p className="text-muted-foreground">{viewExpense.expenseType}</p>
                </div>
                <StatusBadge status={viewExpense.status} className="text-sm px-3 py-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div><p className="text-xs text-slate-500 font-medium">Amount</p><p className="text-xl font-bold text-slate-800">{formatNaira(viewExpense.amount)}</p></div>
                <div><p className="text-xs text-slate-500 font-medium">Request Date</p><p className="text-base font-semibold text-slate-800">{format(new Date(viewExpense.requestDate), 'MMM dd, yyyy')}</p></div>
                <div><p className="text-xs text-slate-500 font-medium">Department</p><p className="font-semibold text-slate-700">{viewExpense.department}</p></div>
                {viewExpense.sbu && <div><p className="text-xs text-slate-500 font-medium">SBU</p><p className="font-semibold text-slate-700">{viewExpense.sbu}</p></div>}
                {viewExpense.dueDate && <div><p className="text-xs text-slate-500 font-medium">Due Date</p><p className="font-semibold text-slate-700">{format(new Date(viewExpense.dueDate), 'MMM dd, yyyy')}</p></div>}
              </div>

              <div><p className="text-sm text-slate-500 font-medium mb-1">Purpose</p><p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{viewExpense.purpose}</p></div>
              {viewExpense.otherInfo && <div><p className="text-sm text-slate-500 font-medium mb-1">Other Information</p><p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{viewExpense.otherInfo}</p></div>}

              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div><p className="text-xs text-blue-500 font-medium">Bank</p><p className="font-semibold text-slate-800 text-sm">{viewExpense.bankName}</p></div>
                <div><p className="text-xs text-blue-500 font-medium">Account Number</p><p className="font-mono font-semibold text-slate-800 text-sm">{viewExpense.accountNumber}</p></div>
                <div><p className="text-xs text-blue-500 font-medium">Account Name</p><p className="font-semibold text-slate-800 text-sm">{viewExpense.accountName}</p></div>
              </div>

              {viewExpense.attachments && viewExpense.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-2">Attachments ({viewExpense.attachments.length})</p>
                  <div className="space-y-2">
                    {viewExpense.attachments.map((url: string, i: number) => (
                      <a key={i} href={getFileUrl(url)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-sm text-primary">
                        <Paperclip className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Attachment {i + 1}</span>
                        <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewExpense.receiptUrl && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-semibold mb-1">Payment Receipt</p>
                  <a href={getFileUrl(viewExpense.receiptUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                    <ExternalLink className="h-4 w-4" /> View Receipt
                  </a>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-display font-semibold mb-3 text-base">Approval Timeline</h4>
                <div className="space-y-3">
                  <TimelineStep title="Manager Approval" name={viewExpense.approverName} date={viewExpense.managerApprovalDate} reason={viewExpense.managerRejectionReason} />
                  <TimelineStep title="Internal Control" name={viewExpense.internalControlName} date={viewExpense.internalControlApprovalDate} reason={viewExpense.internalControlRejectionReason} />
                  <TimelineStep title="Finance Manager" name={viewExpense.financeManagerName} date={viewExpense.financeManagerApprovalDate} reason={viewExpense.financeManagerRejectionReason} />
                  <TimelineStep title="Payment" name={viewExpense.paidDate ? "Finance Team" : undefined} date={viewExpense.paidDate} isLast />
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
        {date ? <p className="text-sm text-slate-500">{format(new Date(date), 'MMM dd, yyyy')}</p> : <p className="text-sm text-slate-400 italic">Pending</p>}
        {reason && <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">{reason}</p>}
      </div>
    </div>
  );
}

function CreateExpenseForm({ onSuccess, users }: { onSuccess: () => void, users: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateExpense({
    mutation: {
      onSuccess: async (data: any) => {
        if (pendingFiles.length > 0) {
          try {
            const formData = new FormData();
            pendingFiles.forEach(f => formData.append("files", f));
            const apiBase = `${window.location.protocol}//${window.location.hostname}:8080`;
            await fetch(`${apiBase}/api/expenses/${data.id}/attachments`, {
              method: "POST",
              credentials: "include",
              body: formData,
            });
          } catch (_) {}
        }
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({ title: "Success", description: "Expense request created successfully." });
        setIsSubmitting(false);
        onSuccess();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create expense." });
        setIsSubmitting(false);
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
    department: user?.department || "",
    sbu: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    amount: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = pendingFiles.length + files.length;
    if (total > 3) {
      toast({ variant: "destructive", title: "Too many files", description: "Maximum 3 attachments allowed." });
      return;
    }
    setPendingFiles(prev => [...prev, ...files].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (status: "draft" | "pending_manager") => {
    if (!formData.expenseName || !formData.expenseType || !formData.amount || !formData.approverId || !formData.department || !formData.bankName || !formData.accountNumber || !formData.accountName) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields." });
      return;
    }
    setIsSubmitting(true);
    createMutation.mutate({
      data: {
        ...formData,
        requesterId: user!.id,
        department: formData.department,
        sbu: formData.sbu || undefined,
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

  const set = (key: string) => (v: string) => setFormData(prev => ({ ...prev, [key]: v }));

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Basic Info */}
        <div className="space-y-2">
          <Label>Expense Name <span className="text-red-500">*</span></Label>
          <Input value={formData.expenseName} onChange={e => setFormData({ ...formData, expenseName: e.target.value })} placeholder="e.g. Client Meeting Lunch" />
        </div>
        <div className="space-y-2">
          <Label>Expense Type <span className="text-red-500">*</span></Label>
          <Select value={formData.expenseType} onValueChange={set('expenseType')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
              {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t} className="cursor-pointer hover:bg-slate-50">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Purpose <span className="text-red-500">*</span></Label>
          <Textarea value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} placeholder="Detailed reason for this expense" className="min-h-[80px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Other Information <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
          <Textarea value={formData.otherInfo} onChange={e => setFormData({ ...formData, otherInfo: e.target.value })} placeholder="Any additional context or notes" className="min-h-[60px]" />
        </div>

        {/* Department & SBU */}
        <div className="space-y-2">
          <Label>Department <span className="text-red-500">*</span></Label>
          <Select value={formData.department} onValueChange={set('department')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50 max-h-60">
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="cursor-pointer hover:bg-slate-50">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>SBU <span className="text-red-500">*</span></Label>
          <Select value={formData.sbu} onValueChange={set('sbu')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select SBU" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50 max-h-60">
              {SBUS.map(s => <SelectItem key={s} value={s} className="cursor-pointer hover:bg-slate-50">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Name of Requester (read-only) */}
        <div className="space-y-2">
          <Label>Name of Requester</Label>
          <Input value={user?.name || ''} disabled className="bg-slate-100 text-slate-600 cursor-not-allowed" />
        </div>

        {/* Amounts & Dates */}
        <div className="space-y-2">
          <Label>Amount (₦) <span className="text-red-500">*</span></Label>
          <Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Request Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={formData.requestDate} onChange={e => setFormData({ ...formData, requestDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Due Date <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
          <Input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
        </div>

        {/* Routing */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="font-semibold text-base border-b pb-2 mt-2">Routing & Approval</h4>
        </div>
        <div className="space-y-2">
          <Label>Manager Approver <span className="text-red-500">*</span></Label>
          <Select value={formData.approverId} onValueChange={set('approverId')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select manager" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
              {approvers.map(u => <SelectItem key={u.id} value={u.id.toString()} className="cursor-pointer hover:bg-slate-50">{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Internal Control <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
          <Select value={formData.internalControlId} onValueChange={set('internalControlId')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select internal control" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
              {internals.map(u => <SelectItem key={u.id} value={u.id.toString()} className="cursor-pointer hover:bg-slate-50">{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Finance Manager <span className="text-red-500">*</span></Label>
          <Select value={formData.financeManagerId} onValueChange={set('financeManagerId')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select finance manager" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
              {finances.map(u => <SelectItem key={u.id} value={u.id.toString()} className="cursor-pointer hover:bg-slate-50">{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Bank Info */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="font-semibold text-base border-b pb-2 mt-2">Bank Information</h4>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Bank Name <span className="text-red-500">*</span></Label>
          <Select value={formData.bankName} onValueChange={set('bankName')}>
            <SelectTrigger className="bg-white border-slate-300"><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50 max-h-60">
              {NIGERIAN_BANKS.map(b => <SelectItem key={b} value={b} className="cursor-pointer hover:bg-slate-50">{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Account Number <span className="text-red-500">*</span></Label>
          <Input maxLength={10} value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })} placeholder="10-digit NUBAN number" />
        </div>
        <div className="space-y-2">
          <Label>Account Name <span className="text-red-500">*</span></Label>
          <Input value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} placeholder="Exact name on account" />
        </div>

        {/* Attachments */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="font-semibold text-base border-b pb-2 mt-2">Attachments <span className="text-slate-400 font-normal text-xs">(max 3 files)</span></h4>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex flex-col items-center text-center mb-4">
              <Paperclip className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 font-medium">Upload supporting documents</p>
              <p className="text-xs text-slate-400 mt-0.5">PDF, Word, Excel, or images — up to 10MB each</p>
            </div>
            {pendingFiles.length < 3 && (
              <div className="flex justify-center">
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.gif" className="hidden" onChange={handleFileChange} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-white">
                  <Plus className="h-4 w-4 mr-1" /> Add File ({pendingFiles.length}/3)
                </Button>
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="ml-2 text-slate-400 hover:text-red-500 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isSubmitting} className="py-6 px-6 rounded-xl">
          Save for Later
        </Button>
        <Button onClick={() => handleSubmit("pending_manager")} disabled={isSubmitting} className="py-6 px-8 rounded-xl shadow-lg shadow-primary/20">
          {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
          Raise Expense Now
        </Button>
      </div>
    </div>
  );
}
