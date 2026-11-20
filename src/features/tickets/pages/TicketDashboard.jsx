import { useEffect, useState } from "react";
import "./TicketDashboard.css";

import useAuth from "../../../hooks/useAuth";

import TicketStats from "../components/TicketStats";
import TicketTable from "../components/TicketTable";

import {
  getTickets,
  getCategories,
  getTicketStatuses,
  getAvailableStaff,
  assignTicket,
  updateTicketStatus,
  createTicket as createTicketAPI,
  withdrawTicket
} from "../services/ticketApi";

function formatStatus(statusName = "") {
  const names = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    REOPENED: "Reopened",
    WITHDRAWN: "Withdrawn"
  };

  return names[String(statusName).toUpperCase()] || statusName;
}

function normalizeRole(profile) {
  const role =
    profile?.role?.name ||
    profile?.roleName ||
    profile?.role ||
    "";

  return String(role)
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function TicketDashboard() {
  const { user: profile, role: authRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [withdrawingTicket, setWithdrawingTicket] = useState(false);

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "MEDIUM",
    description: "",
    location: ""
  });

  const role = authRole || normalizeRole(profile);

  const isAdmin = role === "ADMIN";
  const isStudent = role === "STUDENT";
  const isStaff = role === "STAFF";

  const canRaiseTicket = isStudent || isStaff;

  const displayName =
    profile?.fullName ||
    profile?.name ||
    profile?.email ||
    "Campus User";

  const displayRole = role || "Campus User";
  const currentUserId = profile?.id;

  // Compare UUIDs safely.
  function sameUser(id1, id2) {
    if (!id1 || !id2) return false;

    return (
      String(id1).toLowerCase() ===
      String(id2).toLowerCase()
    );
  }

  // Map backend ticket response to frontend format.
  function mapTicket(ticket, categoryMap, statusMap) {
    const raisedByMe = sameUser(
      ticket.createdBy,
      currentUserId
    );

    const assignedToMe = sameUser(
      ticket.assignedTo,
      currentUserId
    );

    let ticketType = "Other";

    if (isStaff) {
      if (raisedByMe && assignedToMe) {
        ticketType = "Raised by Me & Assigned to Me";
      } else if (raisedByMe) {
        ticketType = "Raised by Me";
      } else if (assignedToMe) {
        ticketType = "Assigned to Me";
      }
    }

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber || "",
      title: ticket.title || "",
      description: ticket.description || "",

      categoryId: ticket.categoryId,
      category: categoryMap.get(ticket.categoryId) || "—",

      priority: ticket.priority || "MEDIUM",

      statusId: ticket.statusId,
      status: formatStatus(
        statusMap.get(ticket.statusId) || "Unknown"
      ),

      createdBy: ticket.createdBy,

      createdByName:
        ticket.createdByName ||
        ticket.raisedByName ||
        "Unknown User",

      assignedTo: ticket.assignedTo || null,

      ticketType,

      date: ticket.createdAt
        ? new Date(ticket.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
        : "—",

      location: ticket.location || "—"
    };
  }

  async function refreshTickets(
    categoryList = categories,
    statusList = statuses
  ) {
    const ticketData = await getTickets();

    const categoryMap = new Map(
      categoryList.map(category => [
        category.id,
        category.name
      ])
    );

    const statusMap = new Map(
      statusList.map(status => [
        status.id,
        status.name
      ])
    );

    const mappedTickets = ticketData.map(ticket =>
      mapTicket(ticket, categoryMap, statusMap)
    );

    setTickets(mappedTickets);

    return ticketData;
  }

  // Initial data loading.
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [ticketData, categoryData, statusData] =
          await Promise.all([
            getTickets(),
            getCategories(),
            getTicketStatuses()
          ]);

        if (!mounted) return;

        setCategories(categoryData);
        setStatuses(statusData);

        const categoryMap = new Map(
          categoryData.map(category => [
            category.id,
            category.name
          ])
        );

        const statusMap = new Map(
          statusData.map(status => [
            status.id,
            status.name
          ])
        );

        setTickets(
          ticketData.map(ticket =>
            mapTicket(ticket, categoryMap, statusMap)
          )
        );

        if (categoryData.length > 0) {
          setForm(previous => ({
            ...previous,
            category: previous.category || categoryData[0].id
          }));
        }

        if (role === "ADMIN") {
          const staffData = await getAvailableStaff();

          if (mounted) {
            setStaffMembers(staffData);
          }
        }
      } catch (err) {
        console.error("Backend loading error:", err);

        if (mounted) {
          setError(
            err.message ||
            "Unable to load data. Please check whether the backend is running."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Role-based ticket visibility.
  const pageTickets = tickets.filter(ticket => {
    if (isAdmin) {
      return true;
    }

    if (isStaff) {
      return (
        sameUser(ticket.createdBy, currentUserId) ||
        sameUser(ticket.assignedTo, currentUserId)
      );
    }

    if (isStudent) {
      return sameUser(ticket.createdBy, currentUserId);
    }

    return false;
  });

  const visibleTickets =
    activePage === "Track Ticket"
      ? pageTickets.filter(ticket =>
        ["Open", "In Progress"].includes(ticket.status)
      )
      : pageTickets;

  const filteredTickets = visibleTickets.filter(ticket => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      ticket.title.toLowerCase().includes(searchText) ||
      ticket.ticketNumber.toLowerCase().includes(searchText);

    const matchesStatus =
      filter === "All" || ticket.status === filter;

    const matchesPriority =
      priorityFilter === "All" ||
      ticket.priority.toUpperCase() === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, priorityFilter, pageSize, activePage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / pageSize)
  );

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function navigate(page) {
    setActivePage(page);
    setSearch("");
    setFilter("All");
    setPriorityFilter("All");
    setCurrentPage(1);

    if (page === "Raise a Ticket") {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  }

  // Create ticket and return to Dashboard.
  async function handleCreateTicket(e) {
    e.preventDefault();

    if (creatingTicket) return;

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.category ||
      !form.location.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setCreatingTicket(true);
      setError("");

      await createTicketAPI({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.category,
        priority: form.priority,
        location: form.location.trim()
      });

      setShowForm(false);
      setActivePage("Dashboard");

      setSearch("");
      setFilter("All");
      setPriorityFilter("All");
      setCurrentPage(1);

      setForm({
        title: "",
        category: categories[0]?.id || "",
        priority: "MEDIUM",
        description: "",
        location: ""
      });

      await refreshTickets();

      alert("Ticket created successfully!");
    } catch (err) {
      console.error("Ticket creation error:", err);
      alert(err.message || "Unable to create ticket.");
    } finally {
      setCreatingTicket(false);
    }
  }

  // Check status update permission.
  function canUpdateStatus(ticket) {
    if (!ticket || ticket.status === "Withdrawn") {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    if (isStaff) {
      return sameUser(ticket.assignedTo, currentUserId);
    }

    return false;
  }

  // Check withdrawal permission.
  function canWithdraw(ticket) {
    if (!ticket || !canRaiseTicket) {
      return false;
    }

    const allowedStatuses = [
      "Open",
      "In Progress",
      "Reopened"
    ];

    return (
      sameUser(ticket.createdBy, currentUserId) &&
      allowedStatuses.includes(ticket.status)
    );
  }

  // Update ticket status.
  async function handleStatusChange(newStatusId) {
    if (!selectedTicket || updatingStatus) return;

    if (!canUpdateStatus(selectedTicket)) {
      alert("You are not authorized to update this ticket.");
      return;
    }

    if (newStatusId === selectedTicket.statusId) return;

    const targetStatus = statuses.find(
      status => status.id === newStatusId
    );

    if (!targetStatus) {
      alert("Selected status not found.");
      return;
    }

    if (targetStatus.name.toUpperCase() === "WITHDRAWN") {
      alert("Please use the separate Withdraw Ticket action.");
      return;
    }

    try {
      setUpdatingStatus(true);

      await updateTicketStatus(
        selectedTicket.id,
        newStatusId
      );

      const updatedStatusName = formatStatus(targetStatus.name);

      setTickets(previous =>
        previous.map(ticket =>
          ticket.id === selectedTicket.id
            ? {
              ...ticket,
              statusId: newStatusId,
              status: updatedStatusName
            }
            : ticket
        )
      );

      setSelectedTicket(previous => ({
        ...previous,
        statusId: newStatusId,
        status: updatedStatusName
      }));

      alert("Ticket status updated successfully!");
    } catch (err) {
      console.error("Status update error:", err);
      alert(err.message || "Unable to update ticket status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Admin assigns or reassigns staff.
  async function handleAssignStaff(staffId) {
    if (!selectedTicket || !isAdmin || assigningTicket) return;

    if (!staffId) return;

    try {
      setAssigningTicket(true);

      const updatedTicket = await assignTicket(
        selectedTicket.id,
        staffId
      );

      setTickets(previous =>
        previous.map(ticket =>
          ticket.id === selectedTicket.id
            ? {
              ...ticket,
              assignedTo: updatedTicket.assignedTo
            }
            : ticket
        )
      );

      setSelectedTicket(previous => ({
        ...previous,
        assignedTo: updatedTicket.assignedTo
      }));

      const assignedStaff = staffMembers.find(
        staff => staff.id === staffId
      );

      alert(
        `Ticket assigned to ${assignedStaff?.name || "selected staff"} successfully!`
      );
    } catch (err) {
      console.error("Ticket assignment error:", err);
      alert(err.message || "Unable to assign ticket.");
    } finally {
      setAssigningTicket(false);
    }
  }

  // Open withdrawal confirmation.
  function handleWithdrawTicket() {
    if (!selectedTicket) return;

    if (!canWithdraw(selectedTicket)) {
      alert(
        "You can withdraw only your own Open, In Progress or Reopened tickets."
      );
      return;
    }

    setShowWithdrawConfirm(true);
  }

  // Confirm and execute secure backend withdrawal.
  async function confirmWithdrawTicket() {
    if (!selectedTicket || withdrawingTicket) return;

    if (!canWithdraw(selectedTicket)) {
      alert("You are not authorized to withdraw this ticket.");
      setShowWithdrawConfirm(false);
      return;
    }

    try {
      setWithdrawingTicket(true);

      const withdrawnResponse = await withdrawTicket(
        selectedTicket.id
      );

      const withdrawnStatus = statuses.find(
        status =>
          status.name?.toUpperCase() === "WITHDRAWN"
      );

      const updatedStatusId =
        withdrawnResponse?.statusId ||
        withdrawnStatus?.id ||
        selectedTicket.statusId;

      // Update the selected ticket immediately.
      setSelectedTicket(previous => ({
        ...previous,
        statusId: updatedStatusId,
        status: "Withdrawn"
      }));

      // Refresh the dashboard with the latest backend data.
      await refreshTickets();

      setShowWithdrawConfirm(false);

      alert(
        `Ticket ${selectedTicket.ticketNumber} withdrawn successfully!`
      );
    } catch (err) {
      console.error("Ticket withdrawal error:", err);

      alert(
        err.message || "Unable to withdraw ticket. Please try again."
      );
    } finally {
      setWithdrawingTicket(false);
    }
  }

  const pageTitles = {
    Dashboard: "Ticket Management",
    "Ticket History": "Ticket History",
    "Track Ticket": "Track Your Ticket",
    "Help & FAQs": "Help & FAQs",
    Notifications: "Notifications",
    Settings: "Settings"
  };

  return (
    <div className="ticket-management">
      <main className="main">
        <section className="content">

          {loading && (
            <div className="simple-panel">
              <h2>Loading tickets...</h2>
              <p>Fetching information from the campus database.</p>
            </div>
          )}

          {!loading && error && (
            <div className="simple-panel">
              <h2>Unable to connect</h2>
              <p>{error}</p>
              <button
                className="gold-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {(activePage === "Dashboard" ||
                activePage === "Ticket History" ||
                activePage === "Track Ticket") && (
                  <>
                    <div className="page-heading">
                      <div>
                        <small className="eyebrow">CAMPUS SUPPORT</small>
                        <h1>{pageTitles[activePage]}</h1>
                        <p>
                          {isAdmin
                            ? "View campus tickets and assign them to staff members."
                            : isStaff
                              ? "View your raised tickets and tickets assigned to you."
                              : "Raise issues, track requests and get campus support."}
                        </p>
                      </div>

                      {canRaiseTicket && (
                        <button
                          className="gold-button"
                          onClick={() => setShowForm(true)}
                        >
                          + &nbsp; Raise a Ticket
                        </button>
                      )}
                    </div>

                    <div className="ticket-page-tabs">
                      <button
                        className={activePage === "Dashboard" ? "active" : ""}
                        onClick={() => navigate("Dashboard")}
                      >
                        All Tickets
                      </button>

                      <button
                        className={activePage === "Ticket History" ? "active" : ""}
                        onClick={() => navigate("Ticket History")}
                      >
                        Ticket History
                      </button>

                      <button
                        className={activePage === "Track Ticket" ? "active" : ""}
                        onClick={() => navigate("Track Ticket")}
                      >
                        Track Tickets
                      </button>

                      {canRaiseTicket && (
                        <button onClick={() => setShowForm(true)}>
                          + Raise Ticket
                        </button>
                      )}
                    </div>

                    {activePage === "Dashboard" && (
                      <TicketStats tickets={pageTickets} />
                    )}

                    {isStaff && (
                      <div className="ticket-type-legend">
                        <span>
                          <b>Ticket Types:</b>
                        </span>
                        <span>Raised by Me = Created by you</span>
                        <span>Assigned to Me = Assigned by Admin</span>
                      </div>
                    )}

                    <TicketTable
                      filteredTickets={filteredTickets}
                      paginatedTickets={paginatedTickets}
                      activePage={activePage}
                      statuses={statuses}
                      formatStatus={formatStatus}
                      filter={filter}
                      setFilter={setFilter}
                      priorityFilter={priorityFilter}
                      setPriorityFilter={setPriorityFilter}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      totalPages={totalPages}
                      onViewTicket={setSelectedTicket}
                      isAdmin={isAdmin}
                      showTicketType={isStaff}
                    />

                    <div className="help-card">
                      <span className="help-icon">♧</span>
                      <div>
                        <b>Need assistance?</b>
                        <p>
                          Raise a ticket and our campus support team will help
                          you resolve your issue.
                        </p>
                      </div>

                      {canRaiseTicket && (
                        <button
                          className="text-button"
                          onClick={() => setShowForm(true)}
                        >
                          Raise Ticket →
                        </button>
                      )}
                    </div>
                  </>
                )}

              {activePage === "Help & FAQs" && (
                <div className="simple-panel">
                  <h2>How can we help you?</h2>
                  <p>Find answers to common campus support questions.</p>

                  <div className="faq-item">
                    <b>How do I raise a ticket?</b>
                    <p>
                      Students and staff can click Raise a Ticket, fill in
                      the issue details and submit the form.
                    </p>
                  </div>

                  <div className="faq-item">
                    <b>Who can update ticket status?</b>
                    <p>
                      Administrators can update tickets in their college.
                      Staff members can update only tickets assigned to them.
                      Students cannot update ticket status.
                    </p>
                  </div>

                  <div className="faq-item">
                    <b>How are tickets assigned?</b>
                    <p>
                      The administrator assigns a ticket to an active staff
                      member belonging to the same college.
                    </p>
                  </div>
                </div>
              )}

              {activePage === "Notifications" && (
                <div className="simple-panel">
                  <h2>Notifications</h2>
                  <p>Notifications are currently on hold.</p>
                </div>
              )}

              {activePage === "Settings" && (
                <div className="simple-panel">
                  <h2>Account Settings</h2>
                  <p>Campus support account information.</p>

                  <div className="faq-item">
                    <b>Account Type</b>
                    <p>{displayRole}</p>
                  </div>

                  <div className="faq-item">
                    <b>Academic Session</b>
                    <p>2026–27</p>
                  </div>

                  <div className="faq-item">
                    <b>Module</b>
                    <p>Ticket Management</p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* RAISE TICKET MODAL */}
      {showForm && canRaiseTicket && (
        <div className="modal-overlay">
          <form className="ticket-form" onSubmit={handleCreateTicket}>
            <div className="form-heading">
              <div>
                <h2>Raise a New Ticket</h2>
                <p>Provide details about your issue.</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                disabled={creatingTicket}
              >
                ✕
              </button>
            </div>

            <label>Issue Title</label>
            <input
              required
              maxLength="100"
              placeholder="Enter issue title"
              value={form.title}
              onChange={e =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <label>Category</label>
            <select
              required
              value={form.category}
              onChange={e =>
                setForm({ ...form, category: e.target.value })
              }
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label>Priority</label>
            <select
              value={form.priority}
              onChange={e =>
                setForm({ ...form, priority: e.target.value })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <label>Location</label>
            <input
              required
              maxLength="200"
              placeholder="Enter building, room or location"
              value={form.location}
              onChange={e =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <label>Description</label>
            <textarea
              required
              rows="4"
              maxLength="1000"
              placeholder="Describe your issue..."
              value={form.description}
              onChange={e =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
                disabled={creatingTicket}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="gold-button"
                disabled={creatingTicket}
              >
                {creatingTicket ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TICKET DETAILS MODAL */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="ticket-form">
            <div className="form-heading">
              <div>
                <small className="eyebrow">TICKET DETAILS</small>
                <h2>{selectedTicket.ticketNumber}</h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setSelectedTicket(null);
                  setShowWithdrawConfirm(false);
                }}
                aria-label="Close ticket details"
                disabled={
                  updatingStatus ||
                  assigningTicket ||
                  withdrawingTicket
                }
              >
                ✕
              </button>
            </div>

            <div className="detail-item">
              <small>Issue Title</small>
              <b>{selectedTicket.title}</b>
            </div>

            <div className="detail-item">
              <small>Raised By</small>
              <b>{selectedTicket.createdByName}</b>
            </div>

            {isStaff && (
              <div className="detail-item">
                <small>Ticket Type</small>
                <b>{selectedTicket.ticketType}</b>
              </div>
            )}

            <div className="detail-item">
              <small>Category</small>
              <b>{selectedTicket.category}</b>
            </div>

            <div className="detail-item">
              <small>Priority</small>
              <b>{selectedTicket.priority}</b>
            </div>

            <div className="detail-item">
              <small>Description</small>
              <p>{selectedTicket.description}</p>
            </div>

            <div className="detail-item">
              <small>Location</small>
              <b>{selectedTicket.location}</b>
            </div>

            <div className="detail-item">
              <small>Current Status</small>
              <b>{selectedTicket.status}</b>
            </div>

            <div className="detail-item">
              <small>Submitted Date</small>
              <b>{selectedTicket.date}</b>
            </div>

            {/* ADMIN ASSIGNMENT */}
            {isAdmin && (
              <>
                <label>Assign / Reassign Staff</label>

                <select
                  value={selectedTicket.assignedTo || ""}
                  onChange={e => handleAssignStaff(e.target.value)}
                  disabled={
                    assigningTicket ||
                    selectedTicket.status === "Withdrawn"
                  }
                >
                  <option value="">Unassigned</option>

                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>

                <p>
                  {assigningTicket
                    ? "Updating assignment..."
                    : "Only active staff members from your college are listed."}
                </p>
              </>
            )}

            {/* STATUS UPDATE */}
            {canUpdateStatus(selectedTicket) && (
              <>
                <label>Update Status</label>

                <select
                  value={selectedTicket.statusId || ""}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  {statuses
                    .filter(
                      status =>
                        status.name.toUpperCase() !== "WITHDRAWN"
                    )
                    .map(status => (
                      <option key={status.id} value={status.id}>
                        {formatStatus(status.name)}
                      </option>
                    ))}
                </select>

                <p>
                  {updatingStatus
                    ? "Updating ticket status..."
                    : isAdmin
                      ? "Administrator can update tickets in this college."
                      : "You can update this ticket because it is assigned to you."}
                </p>
              </>
            )}

            {!canUpdateStatus(selectedTicket) && (
              <div className="faq-item">
                <b>Status update permission</b>
                <p>
                  {isStudent
                    ? "Students cannot update ticket status."
                    : isStaff
                      ? "You can update status only when this ticket is assigned to you."
                      : "You do not have permission to update this ticket."}
                </p>
              </div>
            )}

            {/* WITHDRAW ACTION */}
            {canWithdraw(selectedTicket) && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleWithdrawTicket}
                disabled={
                  updatingStatus ||
                  assigningTicket ||
                  withdrawingTicket
                }
              >
                Withdraw Ticket
              </button>
            )}

            {/* WITHDRAW CONFIRMATION */}
            {showWithdrawConfirm && (
              <div className="faq-item">
                <h3>Confirm Ticket Withdrawal</h3>

                <p>
                  Are you sure you want to withdraw ticket{" "}
                  <b>{selectedTicket.ticketNumber}</b>?
                </p>

                <p>
                  The ticket will not be permanently deleted.
                </p>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowWithdrawConfirm(false)}
                    disabled={withdrawingTicket}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="gold-button"
                    onClick={confirmWithdrawTicket}
                    disabled={withdrawingTicket}
                  >
                    {withdrawingTicket
                      ? "Withdrawing..."
                      : "Confirm Withdrawal"}
                  </button>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="gold-button"
                onClick={() => {
                  setSelectedTicket(null);
                  setShowWithdrawConfirm(false);
                }}
                disabled={
                  updatingStatus ||
                  assigningTicket ||
                  withdrawingTicket
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TicketDashboard;
