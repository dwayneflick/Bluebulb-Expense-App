import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "requester", label: "Requester" },
  { value: "approver_manager", label: "Approver Manager" },
  { value: "internal_control", label: "Internal Control" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "finance_team", label: "Finance Team" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-800 border-violet-200",
  requester: "bg-blue-50 text-blue-700 border-blue-200",
  approver_manager: "bg-amber-50 text-amber-700 border-amber-200",
  internal_control: "bg-cyan-50 text-cyan-700 border-cyan-200",
  finance_manager: "bg-purple-50 text-purple-700 border-purple-200",
  finance_team: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function AdminUsers() {
  const { data: users, isLoading } = useGetUsers();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff accounts and role assignments.</p>
        </div>
        <Button onClick={() => { setEditUser(null); setShowForm(true); }} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {ROLES.map(r => {
          const count = users?.filter(u => u.role === r.value).length || 0;
          return (
            <div key={r.value} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.label}</p>
            </div>
          );
        })}
      </div>

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4 font-semibold text-slate-600">Name</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Email</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Role</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Department</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">Joined</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500">No users found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{user.department}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-primary" onClick={() => { setEditUser(user); setShowForm(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-600" onClick={() => setDeleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
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

      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowForm(false); setEditUser(null); }}
        />
      )}

      {deleteUser && (
        <DeleteUserModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
        />
      )}
    </div>
  );
}

function UserFormModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "",
    department: user?.department || "",
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        toast({ title: "User created", description: `${formData.name} has been added.` });
        onClose();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create user." });
      }
    }
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        toast({ title: "User updated", description: `${formData.name} has been updated.` });
        onClose();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update user." });
      }
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.role || !formData.department) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields." });
      return;
    }
    if (!isEdit && !formData.password) {
      toast({ variant: "destructive", title: "Validation Error", description: "Password is required for new users." });
      return;
    }
    if (isEdit) {
      updateMutation.mutate({ id: user.id, data: { name: formData.name, email: formData.email, role: formData.role, department: formData.department } });
    } else {
      createMutation.mutate({ data: formData as any });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Amaka Johnson" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@bluebulb.com" />
            </div>
            {!isEdit && (
              <div className="space-y-2 col-span-2">
                <Label>Password <span className="text-red-500">*</span></Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Set initial password" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Finance" />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        toast({ title: "User removed", description: `${user.name} has been deleted.` });
        onClose();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete user." });
      }
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-red-700">Remove User</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-700">Are you sure you want to remove <span className="font-semibold">{user.name}</span>? This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => deleteMutation.mutate({ id: user.id })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
