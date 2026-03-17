import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetRetirements, useApproveRetirement } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader2, Check, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function RetireApproval() {
  const { user } = useAuth();
  const { data: retirements, isLoading } = useGetRetirements({ status: 'pending' });
  const [selectedRet, setSelectedRet] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // In a real app, we'd filter based on who is supposed to approve retirements
  const pendingRetirements = retirements?.filter(r => r.status === 'pending');

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  const handleActionClick = (ret: any, action: 'approve' | 'reject') => {
    setSelectedRet(ret);
    setActionType(action);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Retire Approvals</h1>
        <p className="text-muted-foreground mt-1">Review expense retirements submitted by staff.</p>
      </div>

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4 font-semibold text-slate-600">Requester</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Original Expense</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Given / Spent</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRetirements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <ShieldCheck className="h-16 w-16 text-slate-200 mb-4" />
                        <p className="text-xl font-display font-medium text-slate-600">No pending retirements</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRetirements?.map((ret) => (
                    <TableRow key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{ret.requesterName}</div>
                        <div className="text-xs text-muted-foreground">{ret.department}</div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{ret.expenseName}</TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-500 line-through">{formatNaira(ret.amount)}</div>
                        <div className="font-bold text-slate-800">{formatNaira(ret.actualAmount || ret.amount)}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ret.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleActionClick(ret, 'approve')}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleActionClick(ret, 'reject')}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
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

      {selectedRet && (
        <RetireApprovalModal 
          ret={selectedRet} 
          action={actionType} 
          onClose={() => { setSelectedRet(null); setActionType(null); }} 
        />
      )}
    </div>
  );
}

function RetireApprovalModal({ ret, action, onClose }: any) {
  const [reason, setReason] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useApproveRetirement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/retirements'] });
        toast({ title: "Success", description: `Retirement ${action}d successfully.` });
        onClose();
      }
    }
  });

  const handleSubmit = () => {
    if (action === 'reject' && !reason) {
      toast({ variant: "destructive", title: "Required", description: "Please provide a reason for rejection." });
      return;
    }

    approveMutation.mutate({
      id: ret.id,
      data: {
        action: action as 'approve' | 'reject',
        approverId: user!.id,
        reason
      }
    });
  };

  const isPending = approveMutation.isPending;
  const isDestructive = action === 'reject';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{action === 'approve' ? 'Approve' : 'Reject'} Retirement</DialogTitle>
          <DialogDescription>
            {ret.requesterName} - {ret.expenseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Original Amount Given</span> 
              <span className="font-semibold text-slate-500 line-through">{formatNaira(ret.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Actual Amount Spent</span> 
              <span className="text-xl font-bold text-slate-900">{formatNaira(ret.actualAmount || ret.amount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Balance to Return/Refund</span> 
              <span className={`font-bold ${ret.amount - (ret.actualAmount||0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatNaira(Math.abs(ret.amount - (ret.actualAmount||0)))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Comments {action === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <Textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder={`Enter notes here...`}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
