export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

export interface NavBarProps {
  brandName?: string;
  brandLogo?: string;
  navItems?: NavItem[];
  showSearch?: boolean;
  showGitHub?: boolean;
  gitHubUrl?: string;
  isAuthenticated?: boolean;
  user?: {
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
  onSignIn?: () => void;
  onSignOut?: () => void;
  children?: React.ReactNode;
}