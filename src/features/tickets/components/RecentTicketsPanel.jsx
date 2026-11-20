
import { ArrowUpRight, Ticket } from "lucide-react";

function getStatusName(ticket, statuses) {
  const status = statuses.find(
    item => item.id === ticket.statusId
  );

  return status?.name || "Unknown";
}

function formatDate(dateString) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RecentTicketsPanel({
  tickets = [],
  statuses = [],
  loading = false,
  isAdmin = false,
  onViewAll,
}) {
  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <div className="content-panel bookings-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent Tickets</h2>
          <p>
            {isAdmin
              ? "Latest campus support requests"
              : "Your latest support requests"}
          </p>
        </div>

        <button className="text-button" onClick={onViewAll}>
          View all <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="booking-list">
        {loading ? (
          <p className="empty-state">Loading tickets...</p>
        ) : recentTickets.length === 0 ? (
          <p className="empty-state">
            No tickets found. Raise a ticket when you need campus support.
          </p>
        ) : (
          recentTickets.map(ticket => {
            const status = getStatusName(ticket, statuses);
            const normalizedStatus = status.toUpperCase();

            const statusClass =
              ["RESOLVED", "CLOSED"].includes(normalizedStatus)
                ? "confirmed"
                : "pending";

            return (
              <div className="booking-row" key={ticket.id}>
                <div className="booking-resource-icon">
                  <Ticket size={19} />
                </div>

                <div className="booking-details">
                  <strong>
                    {ticket.ticketNumber || "Ticket"} — {ticket.title}
                  </strong>

                  <span>
                    {isAdmin
                      ? `Raised by ${ticket.createdByName || "Campus user"}`
                      : `Priority: ${ticket.priority || "MEDIUM"}`}
                  </span>
                </div>

                <div className="booking-schedule">
                  <strong>{formatDate(ticket.createdAt)}</strong>
                  <span>{ticket.priority || "MEDIUM"} priority</span>
                </div>

                <span className={`status-badge ${statusClass}`}>
                  <span />
                  {status.replaceAll("_", " ")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <button className="panel-footer-button" onClick={onViewAll}>
        View all tickets <ArrowUpRight size={15} />
      </button>
    </div>
  );
}

export default RecentTicketsPanel;