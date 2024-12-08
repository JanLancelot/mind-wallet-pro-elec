import { Menu, Bell } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/useAuth";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, removeNotification, isLoading } = useNotification();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="mr-8">
          <a href="/" className="font-bold text-xl">
            Budgee
          </a>
        </div>

        <div className="hidden md:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4 w-[16rem]">
                    <div className="grid gap-3">
                      <a
                        href="/home"
                        className="block select-none space-y-1 rounded-md p-3 hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="font-medium">Main</div>
                        <p className="text-sm text-muted-foreground">
                          Manage budget and expenses
                        </p>
                      </a>
                      <a
                        href="/chat"
                        className="block select-none space-y-1 rounded-md p-3 hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="font-medium">Chat</div>
                        <p className="text-sm text-muted-foreground">
                          Chat with our AI assistant
                        </p>
                      </a>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  About
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Contact
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
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4">
                  <div className="py-2">
                    <p className="font-medium mb-2 text-lg">Dashboard</p>
                    <div className="pl-4 flex flex-col gap-2">
                      <a href="/home" className="block py-2">
                        <div className="font-medium">Main</div>
                        <p className="text-sm text-muted-foreground">
                          Manage budget and expenses
                        </p>
                      </a>
                      <a href="/chat" className="block py-2">
                        <div className="font-medium">Chat</div>
                        <p className="text-sm text-muted-foreground">
                          Chat with our AI assistant
                        </p>
                      </a>
                    </div>
                  </div>
                  <a href="#" className="block py-2 text-lg">
                    About
                  </a>
                  <a href="#" className="block py-2 text-lg">
                    Contact
                  </a>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="justify-start px-2"
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