
export default function TicketTable({
  tickets = [],
  filteredTickets = [],
  paginatedTickets = [],
  activePage,
  statuses = [],
  formatStatus,
  filter,
  setFilter,
  priorityFilter,
  setPriorityFilter,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalPages,
  onViewTicket,
  isAdmin = false,
  showTicketType = false
}) {
  const columnCount =
    7 + (isAdmin ? 1 : 0) + (showTicketType ? 1 : 0);

  return (
    <section className="ticket-panel">
      <div className="panel-header">
        <div>
          <h3>
            {activePage === "Track Ticket"
              ? "Active Tickets"
              : activePage === "Ticket History"
              ? "All Tickets"
              : "Recent Tickets"}
          </h3>

          <p>
            {activePage === "Track Ticket"
              ? "Only Open and In Progress tickets are shown."
              : "View ticket details and current status."}
          </p>
        </div>

        <div className="filters">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>

            {statuses
              .filter(status =>
                activePage !== "Track Ticket" ||
                ["OPEN", "IN_PROGRESS"].includes(
                  status.name.toUpperCase()
                )
              )
              .map(status => (
                <option
                  key={status.id}
                  value={formatStatus(status.name)}
                >
                  {formatStatus(status.name)}
                </option>
              ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issue Title</th>

              {isAdmin && <th>Raised By</th>}

              {showTicketType && <th>Ticket Type</th>}

              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="ticket-id">
                  {ticket.ticketNumber}
                </td>

                <td className="ticket-title">
                  {ticket.title}
                </td>

                {isAdmin && (
                  <td>
                    {ticket.createdByName || "Unknown User"}
                  </td>
                )}

                {showTicketType && (
                  <td>
                    <span className="ticket-type">
                      {ticket.ticketType || "Other"}
                    </span>
                  </td>
                )}

                <td>{ticket.category}</td>

                <td>
                  <span
                    className={`priority ${(ticket.priority || "medium").toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td>
                  <span
                    className={`status ${(ticket.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {ticket.status}
                  </span>
                </td>

                <td>{ticket.date}</td>

                <td>
                  <button
                    className="view-button"
                    onClick={() => onViewTicket(ticket)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="empty">
                  {activePage === "Track Ticket"
                    ? "No active tickets found."
                    : "No tickets found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer pagination">
        <span>
          Showing{" "}
          {filteredTickets.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1}
          {" - "}
          {Math.min(
            currentPage * pageSize,
            filteredTickets.length
          )}{" "}
          of {filteredTickets.length} tickets
        </span>

        <div className="pagination-controls">
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Tickets per page"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={20}>20 per page</option>
          </select>

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(previous =>
                Math.max(1, previous - 1)
              )
            }
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage(previous =>
                Math.min(totalPages, previous + 1)
              )
            }
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
