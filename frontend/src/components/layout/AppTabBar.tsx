import React, { useState, useEffect } from "react";

interface TabItem {
  label: string;
  icon: string;
  route?: string;
  menu?: boolean;
}

const ITEMS: TabItem[] = [
  { label: "Overview", icon: "lucide:layout-dashboard", route: "/overview" },
  { label: "Workspace", icon: "lucide:list-checks", route: "/my-workspace" },
  { label: "CRM", icon: "lucide:briefcase", route: "/crm-sales" },
  { label: "Finance", icon: "lucide:wallet", route: "/finance" },
  { label: "Menu", icon: "lucide:menu", menu: true },
];

export function AppTabBar() {
  const [currentRoute, setCurrentRoute] = useState<string>(
    () => location.hash.slice(1) || "/login",
  );

  useEffect(() => {
    const handleSync = () => {
      setCurrentRoute(location.hash.slice(1) || "/login");
    };
    window.addEventListener("hashchange", handleSync);
    return () => window.removeEventListener("hashchange", handleSync);
  }, []);

  const isLogin = currentRoute === "/login" || currentRoute === "";
  if (isLogin) return null;

  const handleClick = (item: TabItem) => {
    if (item.route) {
      location.hash = "#" + item.route;
    } else {
      const active = document.querySelector<HTMLElement>(
        "[data-prototype-page]:not([hidden])",
      );
      const burger = active?.querySelector<HTMLElement>(
        '[data-action="kravio:sidebar"]',
      );
      if (burger) burger.click();
    }
  };

  return (
    <nav className="app-tabbar" aria-label="Navigasi utama">
      {ITEMS.map((it) => (
        <button
          key={it.label}
          type="button"
          className="app-tabbar__item"
          data-route={it.route}
          data-menu={it.menu ? "1" : undefined}
          aria-current={it.route === currentRoute ? "page" : undefined}
          onClick={() => handleClick(it)}
        >
          <iconify-icon noobserver icon={it.icon} aria-hidden="true" />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

