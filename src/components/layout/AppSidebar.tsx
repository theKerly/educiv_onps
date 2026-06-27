import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Map, School, Users, GraduationCap,
  Brain, Compass, FileText, Trophy, Settings, BookOpen,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const NAV_PRIMARY = [
  { title: "Vue nationale",   url: "/",              icon: LayoutDashboard },
  { title: "Vue régionale",   url: "/regions",       icon: Map },
  { title: "Établissements",  url: "/etablissements",icon: School },
  { title: "Élèves",          url: "/eleves",        icon: Users },
  { title: "Enseignants",     url: "/enseignants",   icon: GraduationCap },
];

const NAV_IA = [
  { title: "Analyse prédictive",        url: "/predictif",   icon: Brain },
  { title: "Orientation Post-Bac",      url: "/orientation", icon: Compass },
];

const NAV_REPORTING = [
  { title: "Rapports",     url: "/rapports",    icon: FileText },
  { title: "Classements",  url: "/classements", icon: Trophy },
  { title: "Documentation",url: "/docs",        icon: BookOpen },
  { title: "Paramètres",   url: "/parametres",  icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: r => r.location.pathname });
  const isActive = (url: string) => url === "/" ? path === "/" : path.startsWith(url);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-md bg-[color:var(--ci-orange)] flex items-center justify-center text-white font-bold text-sm">O</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">ONPS</div>
            <div className="text-[10px] text-sidebar-foreground/70 uppercase tracking-wider">Observatoire National</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_PRIMARY.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence artificielle</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_IA.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Restitution</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_REPORTING.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2 text-[10px] text-sidebar-foreground/60">
          v1.0 · MEN Côte d'Ivoire
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}