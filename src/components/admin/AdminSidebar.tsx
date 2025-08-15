import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Settings,
  Palette,
  Upload,
  Gauge,
  MessageSquare,
  Download,
  CheckCircle,
  Code2,
  TrendingUp,
  UserCheck,
  FileSearch,
  Database,
  Cloud,
  Rocket,
  Gavel,
  Paintbrush,
  Zap,
  PieChart,
  FolderUp,
  Layers,
  Search,
  Trash2,
  Coins,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Target,
  Lock,
  Shield,
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
  useSidebar,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

// Shared menu item type
type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
};

// 1. Dashboard & Analytics
const dashboardMenuItems: MenuItem[] = [
  { title: "Dashboard Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "User Analytics", url: "/admin/user-analytics", icon: Users },
  { title: "Revenue Analytics", url: "/admin/revenue-analytics", icon: TrendingUp },
  { title: "Series & Chapter Analytics", url: "/admin/series-analytics", icon: PieChart },
  { title: "Site Performance", url: "/admin/performance", icon: Gauge },
];

// 2. Content
const contentMenuItems: MenuItem[] = [
  { title: "Series Manager", url: "/admin/series", icon: BookOpen },
  { title: "Content Upload", url: "/admin/upload", icon: Upload },
  { title: "Uploads Manager", url: "/admin/uploads", icon: FolderUp },
  { title: "Blog Manager", url: "/admin/blog", icon: FileText },
];

// 3. Community
const communityMenuItems: MenuItem[] = [
  { title: "Comments Manager", url: "/admin/comments", icon: MessageSquare },
  { title: "User Manager", url: "/admin/users", icon: Users },
  { title: "Role Manager", url: "/admin/roles", icon: UserCheck },
];

// 4. Monetization
const monetizationMenuItems: MenuItem[] = [
  { title: "Billing Settings", url: "/admin/billing", icon: CreditCard },
  { title: "Monetization Dashboard", url: "/admin/monetization-control", icon: DollarSign },
  { title: "Coin Manager", url: "/admin/coins", icon: Coins },
  { title: "Coin Pricing", url: "/admin/coin-pricing", icon: Target },
  { title: "Purchases & Orders", url: "/admin/purchases", icon: ShoppingCart },
  { title: "Chapter Unlock Settings", url: "/admin/chapter-unlock", icon: Lock },
  { title: "Usage Limits", url: "/admin/usage-limits", icon: Shield },
];

// 5. Appearance
const appearanceMenuItems: MenuItem[] = [
  { title: "Theme Manager", url: "/admin/themes", icon: Palette },
  { title: "Theme Customizer", url: "/admin/theme-customizer", icon: Paintbrush },
  { title: "Footer Manager", url: "/admin/footer-manager", icon: Layers },
];

// 6. System
const systemMenuItems: MenuItem[] = [
  { title: "Site Settings", url: "/admin/settings", icon: Settings },
  { title: "Legal Pages", url: "/admin/legal-pages", icon: Gavel },
  { title: "Media Management", url: "/admin/media", icon: FolderUp },
  { title: "System Checklist", url: "/admin/system-checklist", icon: CheckCircle },
  { title: "Production Readiness", url: "/admin/production-readiness", icon: Rocket },
];

// 7. Security & Monitoring
const securityMenuItems: MenuItem[] = [
  { title: "Watermark Settings", url: "/admin/security/watermark-settings", icon: Shield },
];

// 8. Dev Tools & Maintenance
const devToolsMenuItems: MenuItem[] = [
  { title: "Developer Tools", url: "/admin/developer-tools", icon: Code2 },
  { title: "Data Reset", url: "/admin/data-reset", icon: Database },
  { title: "Data Export", url: "/admin/export", icon: Download },
  { title: "System Changelog", url: "/admin/changelog", icon: FileSearch },
  { title: "Changelog Manager", url: "/admin/changelog-manager", icon: FileText },
  { title: "Cloudflare Panel", url: "/admin/cloudflare", icon: Cloud },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const [query, setQuery] = useState("");

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return currentPath === path;
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string, exact?: boolean) => {
    const active = isActive(path, exact);
    return active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  const isRouteMatch = (item: MenuItem) =>
    item.exact ? currentPath === item.url : currentPath.startsWith(item.url);

  const dashboardOpen = dashboardMenuItems.some(isRouteMatch);
  const contentOpen = contentMenuItems.some(isRouteMatch);
  const communityOpen = communityMenuItems.some(isRouteMatch);
  const monetizationOpen = monetizationMenuItems.some(isRouteMatch);
  const appearanceOpen = appearanceMenuItems.some(isRouteMatch);
  const systemOpen = systemMenuItems.some(isRouteMatch);
  const securityOpen = securityMenuItems.some(isRouteMatch);
  const devToolsOpen = devToolsMenuItems.some(isRouteMatch);

  const allMenuItems = useMemo(
    () => [
      ...dashboardMenuItems,
      ...contentMenuItems,
      ...communityMenuItems,
      ...monetizationMenuItems,
      ...appearanceMenuItems,
      ...systemMenuItems,
      ...securityMenuItems,
      ...devToolsMenuItems,
    ],
    []
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as typeof allMenuItems;
    return allMenuItems.filter((i) => i.title.toLowerCase().includes(q));
  }, [allMenuItems, query]);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">Manga Admin</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Global search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin…"
              className="pl-9"
            />
          </div>
        </div>

        {query ? (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Search Results
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {searchResults.map((item) => (
                  <SidebarMenuItem key={`search-${item.title}`}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.exact} className={getNavClasses(item.url, item.exact)}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {searchResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Dashboard
              </SidebarGroupLabel>
              {dashboardOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {dashboardMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end={item.exact} className={getNavClasses(item.url, item.exact)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Content
              </SidebarGroupLabel>
              {contentOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {contentMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Community
              </SidebarGroupLabel>
              {communityOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {communityMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Monetization
              </SidebarGroupLabel>
              {monetizationOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {monetizationMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Appearance
              </SidebarGroupLabel>
              {appearanceOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {appearanceMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                System
              </SidebarGroupLabel>
              {systemOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {systemMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Security & Monitoring
              </SidebarGroupLabel>
              {securityOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {securityMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Dev Tools & Maintenance
              </SidebarGroupLabel>
              {devToolsOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {devToolsMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClasses(item.url)}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
