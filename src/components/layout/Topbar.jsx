
import { Search, Bell, ChevronRight } from 'lucide-react';

function Topbar() {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Campus</span>
        <ChevronRight size={15} />
        <strong>Dashboard</strong>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search resources, bookings..."
          />
          <kbd>⌘ K</kbd>
        </div>

        <button className="notification-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-date">
          Academic Session
          <strong>2026–27</strong>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
