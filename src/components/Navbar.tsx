import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="mr-8">
          <a href="/" className="font-bold text-xl">MindWallet</a>
        </div>

        <div className="hidden md:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4 w-[16rem]">
                    <div className="grid gap-3">
                      <a href="#" className="block select-none space-y-1 rounded-md p-3 hover:bg-accent hover:text-accent-foreground">
                        <div className="font-medium">Sub navigation 1</div>
                        <p className="text-sm text-muted-foreground">Description for navigation 1</p>
                      </a>
                      <a href="#" className="block select-none space-y-1 rounded-md p-3 hover:bg-accent hover:text-accent-foreground">
                        <div className="font-medium">Sub navigation 2</div>
                        <p className="text-sm text-muted-foreground">Description for navigation 2</p>
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

        <div className="md:hidden ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4">
                <a href="#" className="block py-2 text-lg">Features</a>
                <a href="#" className="block py-2 text-lg">About</a>
                <a href="#" className="block py-2 text-lg">Contact</a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};