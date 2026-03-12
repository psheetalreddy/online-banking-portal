import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Banknote,
  Bell,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Receipt,
  User,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Page } from "../App";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: CreditCard,
    ocid: "nav.accounts.link",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    ocid: "nav.messages.link",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: Receipt,
    ocid: "nav.transactions.link",
  },
  {
    id: "transfer",
    label: "Fund Transfer",
    icon: ArrowLeftRight,
    ocid: "nav.transfer.link",
  },
  {
    id: "payments",
    label: "Payments",
    icon: Banknote,
    ocid: "nav.payments.link",
  },
  { id: "profile", label: "Profile", icon: User, ocid: "nav.profile.link" },
];

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => actor!.getDashboardSummary(),
    enabled: !!actor,
    refetchInterval: 30000,
  });

  const unreadCount = summary?.unreadMessageCount
    ? Number(summary.unreadMessageCount)
    : 0;
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/50 z-20 lg:hidden w-full cursor-default border-0"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static z-30 h-full w-64 flex flex-col transition-transform duration-200",
          "bg-sidebar text-sidebar-foreground",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">ClearBank</span>
          </div>
          <button
            type="button"
            className="lg:hidden text-sidebar-foreground/60 hover:text-white"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={item.ocid}
                onClick={() => {
                  onNavigate(item.id);
                  closeSidebar();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.id === "messages" && unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            type="button"
            data-ocid="header.logout.button"
            onClick={() => clear()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-foreground">
              {NAV_ITEMS.find((n) => n.id === currentPage)?.label ??
                currentPage}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-ocid="header.notifications.button"
              onClick={() => onNavigate("messages")}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
