import { useAuth } from "@/hooks/use-auth";
import { useGetRetirements } from "@workspace/api-client-react";
import { formatNaira } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Loader2, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyRetirements() {
  const { user } = useAuth();
  const { data: retirements, isLoading } = useGetRetirements({ requesterId: user?.id });

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Retirements</h1>
        <p className="text-muted-foreground mt-1">Track the status of your retired expenses.</p>
      </div>

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
                  <TableHead className="py-4 font-semibold text-slate-600">Date Submitted</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retirements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-500">No retirements found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  retirements?.map((ret) => (
                    <TableRow key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">{ret.expenseName}</TableCell>
                      <TableCell className="text-slate-600">{formatNaira(ret.amount)}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{formatNaira(ret.actualAmount || ret.amount)}</TableCell>
                      <TableCell className="text-slate-500">{format(new Date(ret.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <StatusBadge status={ret.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
