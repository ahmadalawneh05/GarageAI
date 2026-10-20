import { Link, useLocation } from 'react-router';
import { Settings, LogIn, LogOut, Sun, Moon, MessageCircle, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Avoid a light/dark mismatch flash before the theme is resolved on the client
  useEffect(() => setMounted(true), []);

  // Close the mobile menu on every navigation so it doesn't stay open across pages
  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Hide navigation on auth pages
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative">
                <Settings className="h-8 w-8 text-primary" strokeWidth={2} />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
              </div>
              <span className="text-xl font-semibold text-foreground">Garage AI</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive('/') ? 'secondary' : 'ghost'}
                  className="rounded-lg"
                >
                  Home
                </Button>
              </Link>
              <Link to="/chat">
                <Button
                  variant={isActive('/chat') ? 'secondary' : 'ghost'}
                  className="rounded-lg gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask GarageAI
                </Button>
              </Link>
              <Link to="/history">
                <Button
                  variant={isActive('/history') ? 'secondary' : 'ghost'}
                  className="rounded-lg"
                >
                  History
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant={isActive('/about') ? 'secondary' : 'ghost'}
                  className="rounded-lg"
                >
                  About
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg md:hidden"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {user ? (
              <>
                <Link to="/settings" className="hidden md:block">
                  <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <span className="hidden md:inline text-sm text-muted-foreground">{user.name}</span>
                <Button variant="ghost" className="rounded-lg gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button className="rounded-lg gap-2">
                  <LogIn className="h-4 w-4" />
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 gap-0 w-72 flex flex-col">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" strokeWidth={2} />
              Garage AI
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-3">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                className="w-full justify-start rounded-lg"
              >
                Home
              </Button>
            </Link>
            <Link to="/chat">
              <Button
                variant={isActive('/chat') ? 'secondary' : 'ghost'}
                className="w-full justify-start rounded-lg gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Ask GarageAI
              </Button>
            </Link>
            <Link to="/history">
              <Button
                variant={isActive('/history') ? 'secondary' : 'ghost'}
                className="w-full justify-start rounded-lg"
              >
                History
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant={isActive('/about') ? 'secondary' : 'ghost'}
                className="w-full justify-start rounded-lg"
              >
                About
              </Button>
            </Link>
            {user && (
              <Link to="/settings">
                <Button
                  variant={isActive('/settings') ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-lg gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
