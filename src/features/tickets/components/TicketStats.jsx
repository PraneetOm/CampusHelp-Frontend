
export default function TicketStats({ tickets = [] }) {
  const openCount = tickets.filter(
    ticket => ticket.status === "Open"
  ).length;

  const progressCount = tickets.filter(
    ticket => ticket.status === "In Progress"
  ).length;

  const resolvedCount = tickets.filter(
    ticket => ticket.status === "Resolved"
  ).length;

  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-top">
          <span>Total Tickets</span>
          <span className="stat-icon blue">▤</span>
        </div>
        <h2>{tickets.length.toString().padStart(2, "0")}</h2>
        <small>Tickets visible to your account</small>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Open Tickets</span>
          <span className="stat-icon red">◷</span>
        </div>
        <h2>{openCount.toString().padStart(2, "0")}</h2>
        <small>Awaiting resolution</small>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>In Progress</span>
          <span className="stat-icon gold">◴</span>
        </div>
        <h2>{progressCount.toString().padStart(2, "0")}</h2>
        <small>Currently being handled</small>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Resolved</span>
          <span className="stat-icon green">✓</span>
        </div>
        <h2>{resolvedCount.toString().padStart(2, "0")}</h2>
        <small>Successfully completed</small>
      </div>
    </div>
  );
}
