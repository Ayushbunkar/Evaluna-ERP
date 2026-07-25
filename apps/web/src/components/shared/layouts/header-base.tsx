"use client";

import { Button } from "@evaluna/ui/components/button";
import { Menu, Search, Bell, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface HeaderBaseProps {
  title: string;
  onMenuClick: () => void;
}

export function HeaderBase({ title, onMenuClick }: HeaderBaseProps) {
  const { session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <h1 className="text-lg font-semibold tracking-tight hidden md:block">{title}</h1>
        
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search (Ctrl+K)..."
              className="w-full rounded-md border bg-muted/50 pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary md:w-[300px] lg:w-[400px]"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <UserIcon className="h-5 w-5 text-primary" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || 'email@example.com'}
                </p>
                <p className="text-xs mt-1 bg-primary/10 text-primary w-max px-2 py-0.5 rounded-full capitalize">
                  {session?.user?.role?.replace("_", " ") || 'Role'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}