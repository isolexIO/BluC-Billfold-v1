

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { 
  Wallet, 
  Home, 
  Send, 
  Download, 
  History, 
  Settings,
  LogOut,
  User as UserIcon,
  TrendingUp,
  Shield, // New import for Admin icon
  Repeat, // New import for Swap icon
  Cpu // New import for Mining icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { WalletProvider } from "@/components/wallet/WalletProvider";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Send",
    url: createPageUrl("Send"),
    icon: Send,
  },
  {
    title: "Receive",
    url: createPageUrl("Receive"),
    icon: Download,
  },
  {
    title: "Multi-Chain",
    url: createPageUrl("MultiChain"),
    icon: Wallet,
  },
  {
    title: "Staking",
    url: createPageUrl("Staking"),
    icon: TrendingUp,
  },
  {
    title: "Mining", // New Mining item
    url: createPageUrl("Mining"),
    icon: Cpu,
  },
  {
    title: "History",
    url: createPageUrl("History"),
    icon: History,
  },
];

const bottomNavigationItems = [
  {
    title: "Swap BLC",
    url: createPageUrl("Swap"),
    icon: Repeat
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

const adminNavigationItems = [
  {
    title: "Admin",
    url: createPageUrl("Admin"),
    icon: Shield,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b85aecf045e1f939b1fbf6/06225600f_7299877ff8ae78677197cdca21bab1df-1-154x154.png" 
              alt="$BluC Logo" 
              className="w-14 h-14 md:w-16 md:h-16 rounded-full"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">$BluC Billfold</h1>
          <p className="text-gray-300 mb-8 text-sm md:text-base">Secure BluChip cryptocurrency wallet</p>
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-600 hover:to-cyan-500 text-white py-3 rounded-lg font-medium"
          >
            Sign In with Google
          </Button>
          <div className="text-sm mt-6">
            <Link to={createPageUrl("ImportWallet")} className="font-medium text-cyan-400 hover:text-cyan-300">
              Or import an existing wallet
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            New users will automatically get a wallet created
          </p>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-900">
          <style>
            {`
              /* Global responsive base font size */
              html {
                font-size: 14px;
              }
              @media (min-width: 768px) {
                html {
                  font-size: 16px;
                }
              }

              /* Global dark button styling */
              button, .btn, [role="button"] {
                background-color: rgb(31 41 55) !important; /* gray-800 */
                color: rgb(243 244 246) !important; /* gray-100 */
                border-color: rgb(55 65 81) !important; /* gray-700 */
              }
              
              button:hover, .btn:hover, [role="button"]:hover {
                background-color: rgb(55 65 81) !important; /* gray-700 */
                color: rgb(255 255 255) !important;
              }
              
              button:disabled, .btn:disabled, [role="button"]:disabled {
                background-color: rgb(17 24 39) !important; /* gray-900 */
                color: rgb(107 114 128) !important; /* gray-500 */
                opacity: 0.6;
              }
              
              /* Primary action buttons with brand colors */
              button.bg-blue-600, button.bg-green-600, button.bg-purple-600,
              .bg-blue-600, .bg-green-600, .bg-purple-600 {
                background: linear-gradient(135deg, rgb(147 51 234), rgb(6 182 212)) !important;
                color: rgb(255 255 255) !important;
                border-color: transparent !important;
              }
              
              button.bg-blue-600:hover, button.bg-green-600:hover, button.bg-purple-600:hover,
              .bg-blue-600:hover, .bg-green-600:hover, .bg-purple-600:hover {
                background: linear-gradient(135deg, rgb(126 34 206), rgb(8 145 178)) !important;
              }
              
              /* Outline buttons */
              button[variant="outline"], .btn-outline {
                background-color: transparent !important;
                border: 1px solid rgb(75 85 99) !important; /* gray-600 */
                color: rgb(243 244 246) !important;
              }
              
              button[variant="outline"]:hover, .btn-outline:hover {
                background-color: rgb(31 41 55) !important;
                border-color: rgb(147 51 234) !important;
              }
              
              /* Ghost buttons */
              button[variant="ghost"], .btn-ghost {
                background-color: transparent !important;
                color: rgb(243 244 246) !important;
                border: none !important;
              }
              
              button[variant="ghost"]:hover, .btn-ghost:hover {
                background-color: rgb(31 41 55) !important;
              }
              
              /* Destructive buttons */
              button[variant="destructive"], .btn-destructive {
                background-color: rgb(153 27 27) !important; /* red-800 */
                color: rgb(255 255 255) !important;
              }
              
              button[variant="destructive"]:hover, .btn-destructive:hover {
                background-color: rgb(127 29 29) !important; /* red-900 */
              }
              
              /* Input fields for consistency */
              input, textarea, select {
                background-color: rgb(31 41 55) !important;
                border-color: rgb(75 85 99) !important;
                color: rgb(243 244 246) !important;
              }
              
              input:focus, textarea:focus, select:focus {
                border-color: rgb(147 51 234) !important;
                box-shadow: 0 0 0 1px rgb(147 51 234) !important;
              }
            `}
          </style>
          
          <Sidebar className="border-r border-gray-700 bg-gray-900">
            <SidebarHeader className="border-b border-gray-700 p-4 bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center p-1">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b85aecf045e1f939b1fbf6/06225600f_7299877ff8ae78677197cdca21bab1df-1-154x154.png" 
                    alt="$BluC Logo" 
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-white">$BluC Billfold</h2>
                  <p className="text-xs text-gray-400">Web Wallet</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2 flex-1 bg-gray-900 flex flex-col justify-between">
              <div> {/* Wrapper for top and potentially middle groups */}
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-2">
                    Wallet
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className={`hover:bg-purple-500/10 hover:text-purple-300 transition-colors duration-200 rounded-lg mb-1 text-gray-300 ${
                              location.pathname === item.url ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : ''
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2 text-sm">
                              <item.icon className="w-4 h-4" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>
              
              <div> {/* Wrapper for bottom groups (Admin and Tools) */}
                {user && user.role === 'admin' && ( // Conditional rendering for Admin panel
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-2">
                      Admin
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {adminNavigationItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              className={`hover:bg-purple-500/10 hover:text-purple-300 transition-colors duration-200 rounded-lg mb-1 text-gray-300 ${
                                location.pathname === item.url ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2 text-sm">
                                <item.icon className="w-4 h-4" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
                 <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-2">
                      Tools
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {bottomNavigationItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              className={`hover:bg-purple-500/10 hover:text-purple-300 transition-colors duration-200 rounded-lg mb-1 text-gray-300 ${
                                location.pathname === item.url ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2 text-sm">
                                <item.icon className="w-4 h-4" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
              </div>

            </SidebarContent>

            <SidebarFooter className="border-t border-gray-700 p-4 bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col bg-gray-900">
            <header className="bg-gray-900 border-b border-gray-700 px-4 md:px-6 py-3 md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200 text-gray-300" />
                <h1 className="text-lg font-semibold text-white">$BluC Billfold</h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </WalletProvider>
  );
}

