"use client";

import { useState, memo } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";

export const NavUser = memo(function NavUser() {
  const { isMobile } = useSidebar();
  const { user, signOut } = useAuthQuery();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 사용자가 없으면 아무것도 표시하지 않음 (404 페이지 등에서 스켈레톤 방지)
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getInitials = (userData: {
    email: string;
    user_metadata?: { full_name?: string };
  }) => {
    const fullName = userData.user_metadata?.full_name;
    if (fullName && fullName.trim()) {
      return fullName.trim().charAt(0).toUpperCase();
    }
    return userData.email.charAt(0).toUpperCase();
  };

  const displayName = user.user_metadata?.full_name || user.email.split("@")[0];

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={displayName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                  <BadgeCheck />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle />
                  Feedback
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
});
