"use client";

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NavBarProps } from "@/types/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ThemeToggler from "@/components/theme/toggler";

function useScroll(threshold: number = 50) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}

export function Navbar({
  brandName = "triggerr",
  brandLogo,
  navItems = [
    { title: "Home", href: "/" },
    { title: "Docs", href: "/docs" },
    { title: "Examples", href: "/examples" },
  ],

  isAuthenticated = false,
  user,
  onSignIn,
  onSignOut,
  children,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScroll(50);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  const handleMobileNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop/Tablet Header */}
      <header
        className={cn(
          "sticky top-0 z-40 flex w-full justify-center transition-all duration-200",
          "bg-[hsl(var(--background)/0.8)] backdrop-blur-xl",
        )}
      >
        <div className="flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - Brand and Navigation */}
          <div className="flex items-center gap-6 md:gap-10">
            {/* Brand */}
            <NavLink to="/" className="flex items-center space-x-2">
              {brandLogo && (
                <Image
                  src={brandLogo}
                  alt={`${brandName} logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              )}
              <span className="text-xl font-bold text-[hsl(var(--foreground))]">
                {brandName}
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            {navItems.length > 0 && (
              <nav className="hidden gap-6 md:flex">
                {navItems.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.disabled ? "#" : item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center text-sm font-medium transition-colors hover:text-primary",
                        item.disabled
                          ? "cursor-not-allowed opacity-50 text-muted-foreground"
                          : isActive
                            ? "text-primary underline underline-offset-4"
                            : "text-foreground",
                      )
                    }
                  >
                    {item.title}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>

          {/* Right side - Actions, Auth */}
          <div className="flex items-center space-x-3">
            {/* Desktop Only - Theme Toggler */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Theme Toggler */}
              <ThemeToggler className="text-foreground hover:text-primary" />
            </div>

            {/* Authentication */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                {user?.image && (
                  <Image
                    src={user?.image || "/default-avatar.png"}
                    alt={user?.name || "User"}
                    className="h-8 w-8 rounded-full"
                    width={32}
                    height={32}
                  />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name}
                </span>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              onSignIn && (
                <button
                  onClick={onSignIn}
                  className="hidden md:flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign In
                </button>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileOpen && (
        <nav className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-full flex-col overflow-auto px-4 py-6">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {brandLogo && (
                  <Image
                    src={brandLogo}
                    alt={`${brandName} logo`}
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                )}
                <span className="text-xl font-bold text-foreground">
                  {brandName}
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="mt-8 flex-1">
              {/* Navigation Items */}
              {navItems.length > 0 && (
                <ul className="space-y-1">
                  {navItems.map((item, index) => (
                    <li key={index}>
                      <NavLink
                        to={item.disabled ? "#" : item.href}
                        onClick={handleMobileNavClick}
                        className={cn(
                          "block rounded-lg px-3 py-3 text-base font-medium",
                          item.disabled
                            ? "cursor-not-allowed opacity-50 text-muted-foreground"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}

              {/* Authentication Links (Mobile) */}
              <div className="mt-8 space-y-1 pt-4">
                {isAuthenticated ? (
                  <>
                    {user?.role === "ADMIN" && (
                      <NavLink
                        to="/admin"
                        onClick={handleMobileNavClick}
                        className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                      >
                        Admin
                      </NavLink>
                    )}
                    <NavLink
                      to="/dashboard"
                      onClick={handleMobileNavClick}
                      className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                    >
                      Dashboard
                    </NavLink>
                    {onSignOut && (
                      <button
                        onClick={() => {
                          onSignOut();
                          handleMobileNavClick();
                        }}
                        className="block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-destructive hover:bg-destructive/10"
                      >
                        Sign Out
                      </button>
                    )}
                  </>
                ) : (
                  onSignIn && (
                    <button
                      onClick={() => {
                        onSignIn();
                        handleMobileNavClick();
                      }}
                      className="block w-full rounded-lg bg-blue-600 px-3 py-3 text-center text-base font-medium text-white hover:bg-blue-700"
                    >
                      Sign In
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="flex items-center justify-center space-x-6 border-t border-border pt-6">
              <ThemeToggler className="text-muted-foreground hover:text-foreground" />
            </div>

            {/* Custom content slot */}
            {children && (
              <div className="mt-6 border-t border-border pt-6">{children}</div>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

export default Navbar;
