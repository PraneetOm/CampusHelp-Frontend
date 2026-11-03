
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Ticket,
  ArrowUpRight,
  Plus,
  MapPin,
  Users,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Bookings',
    value: '12',
    note: 'Across all resources',
    icon: CalendarDays,
    color: 'blue',
  },
  {
    label: 'Upcoming Bookings',
    value: '04',
    note: 'Scheduled ahead',
    icon: Clock3,
    color: 'gold',
  },
  {
    label: 'Completed',
    value: '08',
    note: 'Successfully completed',
    icon: CheckCircle2,
    color: 'green',
  },
  {
    label: 'Open Tickets',
    value: '02',
    note: 'Awaiting resolution',
    icon: Ticket,
    color: 'red',
  },
];

const bookings = [
  {
    name: 'Computer Lab 01',
    type: 'Laboratory',
    date: '04 Nov 2026',
    time: '10:00 AM – 12:00 PM',
    status: 'Confirmed',
  },
  {
    name: 'Seminar Hall A',
    type: 'Seminar Hall',
    date: '05 Nov 2026',
    time: '02:00 PM – 04:00 PM',
    status: 'Pending',
  },
  {
    name: 'Conference Room',
    type: 'Meeting Room',
    date: '06 Nov 2026',
    time: '11:00 AM – 12:00 PM',
    status: 'Confirmed',
  },
];

function Dashboard() {
  return (
    <div className="dashboard">
      <section className="page-heading">
        <div>
          <p className="page-eyebrow">CAMPUS OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Manage your campus activities and resource bookings.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Book a resource
        </button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.label}>
              <div className="stat-card-top">
                <span>{stat.label}</span>
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={19} />
                </div>
              </div>

              <h2>{stat.value}</h2>
              <p>{stat.note}</p>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <div className="content-panel bookings-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Bookings</h2>
              <p>Your latest resource reservations</p>
            </div>

            <button className="text-button">
              View all <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="booking-list">
            {bookings.map((booking) => (
              <div className="booking-row" key={booking.name}>
                <div className="booking-resource-icon">
                  <CalendarDays size={19} />
                </div>

                <div className="booking-details">
                  <strong>{booking.name}</strong>
                  <span>{booking.type}</span>
                </div>

                <div className="booking-schedule">
                  <strong>{booking.date}</strong>
                  <span>{booking.time}</span>
                </div>

                <span
                  className={`status-badge ${
                    booking.status === 'Confirmed'
                      ? 'confirmed'
                      : 'pending'
                  }`}
                >
                  <span />
                  {booking.status}
                </span>
              </div>
            ))}
          </div>

          <button className="panel-footer-button">
            View all bookings <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="content-panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Common campus activities</p>
            </div>
          </div>

          <button className="quick-action">
            <div className="quick-action-icon">
              <CalendarDays size={19} />
            </div>
            <div>
              <strong>Book a resource</strong>
              <span>Find and reserve campus facilities</span>
            </div>
            <ArrowUpRight size={16} />
          </button>

          <button className="quick-action">
            <div className="quick-action-icon">
              <Ticket size={19} />
            </div>
            <div>
              <strong>Raise a ticket</strong>
              <span>Report an issue or request assistance</span>
            </div>
            <ArrowUpRight size={16} />
          </button>

          <button className="quick-action">
            <div className="quick-action-icon">
              <MapPin size={19} />
            </div>
            <div>
              <strong>Explore resources</strong>
              <span>Browse available campus facilities</span>
            </div>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      <section className="dashboard-bottom">
        <div className="content-panel welcome-panel">
          <div className="welcome-icon">
            <Users size={22} />
          </div>
          <div>
            <h2>Your campus, better connected.</h2>
            <p>
              Access facilities, manage reservations and stay updated
              with campus services from one place.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
