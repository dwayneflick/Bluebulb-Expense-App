import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Receipt, 
  CheckSquare, 
  WalletCards, 
  ShieldCheck, 
  HelpCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isApprover = user?.role === 'approver_manager' || 
                     user?.role === 'internal_control' || 
                     user?.role === 'finance_manager' || 
                     user?.role === 'admin';

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { href: "/expenses", label: "My Expense Requests", icon: Receipt, visible: true },
    { href: "/approvals", label: "Expense Approval", icon: CheckSquare, visible: isApprover },
    { href: "/retirements", label: "My Retirements", icon: WalletCards, visible: true },
    { href: "/retire-approvals", label: "Retire Approval", icon: ShieldCheck, visible: isApprover },
    { href: "/help", label: "Help & Support", icon: HelpCircle, visible: true },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed top-0 left-0 z-20 shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-accent">
        <img 
          src={`${import.meta.env.BASE_URL}images/logo.png`} 
          alt="Bluebulb Logo" 
          className="h-8 w-8 mr-3 filter brightness-0 invert" 
        />
        <h1 className="font-display font-bold text-xl tracking-wide text-white">Bluebulb</h1>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-4">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Menu</p>
        </div>
        {navItems.filter(item => item.visible).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className={cn("mr-3 h-5 w-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-accent">
        <div className="flex items-center px-3 py-2 mb-2 bg-sidebar-accent/50 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-foreground font-bold mr-3">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-destructive-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
