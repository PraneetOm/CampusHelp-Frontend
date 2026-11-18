
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Clock3,
  GraduationCap,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const navigationByRole = {
  STUDENT: [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, to: "/" },
      ],
    },
    {
      title: "CAMPUS SERVICES",
      items: [
        { label: "Book a Resource", icon: CalendarDays, to: "/resources" },
        { label: "Availability", icon: Clock3, to: "/availability" },
        { label: "My Bookings", icon: Building2, to: "/bookings" },
      ],
    },
  ],

  STAFF: [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, to: "/" },
      ],
    },
    {
      title: "CAMPUS SERVICES",
      items: [
        { label: "Book a Resource", icon: CalendarDays, to: "/resources" },
        { label: "Availability", icon: Clock3, to: "/availability" },
        { label: "My Bookings", icon: Building2, to: "/bookings" },
      ],
    },
  ],

  ADMIN: [
    {
      title: "ADMINISTRATION",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, to: "/" },
        { label: "Resource Requests", icon: ClipboardList, to: "/admin/bookings" },
        { label: "Resource Management", icon: Building2, to: "/admin/resources" },
      ],
    },
    {
      title: "CAMPUS",
      items: [
        { label: "Resource Availability", icon: Clock3, to: "/availability" },
        { label: "Browse Resources", icon: CalendarDays, to: "/resources" },
      ],
    },
  ],
};

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Sidebar() {
  const { user, role } = useAuth();

  const normalizedRole = role?.toUpperCase();
  const navigation = navigationByRole[normalizedRole] || navigationByRole.STUDENT;

  const displayName =
    user?.name ||
    user?.email?.split("@")[0] ||
    "Campus User";

  const displayRole = normalizedRole
    ? normalizedRole.charAt(0) + normalizedRole.slice(1).toLowerCase()
    : "Campus User";

  const initials = getInitials(displayName);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <GraduationCap size={23} />
        </div>

        <div className="brand-text">
          <h2>CampusDesk</h2>
          <span>RESOURCE MANAGEMENT</span>
        </div>
      </div>

      <div className="sidebar-campus">
        <div className="campus-avatar">BV</div>
        <div className="campus-info">
          <strong>My Campus</strong>
          <span>Academic Institution</span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        {navigation.map((section) => (
          <div className="nav-section" key={section.title}>
            <p className="nav-section-title">{section.title}</p>

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  to={item.to}
                  key={item.label}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>

        <div className="sidebar-user-info">
          <strong>{displayName}</strong>
          <span>{displayRole}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;