"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LifeBuoy, LogOut, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <Sheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        trigger={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        }
      >
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
      </Sheet>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 sm:max-w-xs">
            <Search className="h-4 w-4" />
            <span>Search documents & actions…</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] sm:inline">
              /
            </kbd>
          </button>
        </DialogTrigger>
        <DialogContent className="top-[15%] translate-y-0 p-0">
          <GlobalSearch />
        </DialogContent>
      </Dialog>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Help">
          <LifeBuoy className="h-[18px] w-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {initials(user?.full_name || "WF")}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">
                {user?.full_name || "WorkFlow User"}
              </p>
              <p className="truncate text-xs">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
