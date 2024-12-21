import { Menu, Bell } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNotification } from "./NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import budgee from "../assets/budgee.png";

export default function Navbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, removeNotification, isLoading } = useNotification();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="mr-8 flex items-center">
          <Link to="/" className="font-bold text-xl flex items-center">
             <img src={budgee} alt="Budgee Logo" className="h-8 w-8 mr-2 rounded-full" />
             Budgee
          </Link>
        </div>

        <div className="hidden md:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/home") && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to="/home">Main</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/chat") && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to="/chat">Chat</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/about") && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/contact") && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to="/contact">Contact</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {isLoading ? (
                <DropdownMenuItem>Loading notifications...</DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex items-center justify-between"
                    onSelect={() => removeNotification(notification.id)}
                  >
                    <span>{notification.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {notification.createdAt?.toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={handleSignOut} className="hidden md:flex">
            Sign Out
          </Button>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col gap-4 pt-4">
                  <Button
                    asChild
                    variant={isActive("/home") ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-12 text-lg",
                      isActive("/home") && "font-semibold"
                    )}
                  >
                    <Link to="/home">Main</Link>
                  </Button>
                  <Button
                    asChild
                    variant={isActive("/chat") ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-12 text-lg",
                      isActive("/chat") && "font-semibold"
                    )}
                  >
                    <Link to="/chat">Chat</Link>
                  </Button>
                  <Button
                    asChild
                    variant={isActive("/about") ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-12 text-lg",
                      isActive("/about") && "font-semibold"
                    )}
                  >
                    <Link to="/about">About</Link>
                  </Button>
                  <Button
                    asChild
                    variant={isActive("/contact") ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-12 text-lg",
                      isActive("/contact") && "font-semibold"
                    )}
                  >
                    <Link to="/contact">Contact</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="justify-start h-12 text-lg mt-4"
                  >
                    Sign Out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}