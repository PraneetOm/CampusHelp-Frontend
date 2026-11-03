
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Ticket,
  Bell,
  Settings,
  HelpCircle,
  GraduationCap,
  ChevronDown,
  Clock3,
  ClipboardList
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navigation = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    ],
  },
  {
    title: 'CAMPUS SERVICES',
    items: [
      { label: 'Book a Resource', icon: CalendarDays, to: '/resources' },
      { label: 'Availability', icon: Clock3, to: '/availability' },
      { label: 'My Bookings', icon: Building2, to: '/bookings' },
      { label: 'Helpdesk Tickets', icon: Ticket, to: '/tickets' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Manage Resources',
        icon: ClipboardList,
        to: '/admin/resources',
      },
      {
        label: 'Manage Bookings',
        icon: CalendarDays,
        to: '/admin/bookings',
      },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { label: 'Notifications', icon: Bell, to: '/notifications' },
      { label: 'Settings', icon: Settings, to: '/settings' },
    ],
  },
];

function Sidebar() {
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
        <ChevronDown size={16} />
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
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
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

      <div className="sidebar-help">
        <HelpCircle size={18} />
        <div>
          <strong>Need assistance?</strong>
          <span>Contact campus support</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">PO</div>
        <div className="sidebar-user-info">
          <strong>Praneet Om</strong>
          <span>Student</span>
        </div>
        <ChevronDown size={16} />
      </div>
    </aside>
  );
}

export default Sidebar;
