
import apiClient from "../../../services/api/apiClient";

export async function getTickets() {
  const response = await apiClient.get("/api/tickets");
  return response.data;
}

export async function getCategories() {
  const response = await apiClient.get("/api/categories");
  return response.data;
}

export async function getTicketStatuses() {
  const response = await apiClient.get("/api/ticket-statuses");
  return response.data;
}

export async function getAvailableStaff() {
  const response = await apiClient.get("/api/tickets/staff");
  return response.data;
}

export async function createTicket(ticketData) {
  const response = await apiClient.post("/api/tickets", {
    title: ticketData.title,
    description: ticketData.description,
    categoryId: ticketData.categoryId || null,
    location: ticketData.location,
    priority: ticketData.priority,
  });

  return response.data;
}

export async function assignTicket(ticketId, staffId) {
  const response = await apiClient.patch(
    `/api/tickets/${ticketId}/assign`,
    { assignedTo: staffId }
  );

  return response.data;
}

export async function updateTicketStatus(ticketId, statusId) {
  const response = await apiClient.patch(
    `/api/tickets/${ticketId}/status`,
    { statusId }
  );

  return response.data;
}

export async function withdrawTicket(ticketId) {
  const response = await apiClient.patch(
    `/api/tickets/${ticketId}/withdraw`
  );

  return response.data;
}

export async function filterTickets({
  keyword = "",
  priority = "",
  statusId = "",
} = {}) {
  const params = {};

  if (keyword.trim()) params.keyword = keyword.trim();
  if (priority && priority !== "All") params.priority = priority;
  if (statusId && statusId !== "All") params.statusId = statusId;

  const response = await apiClient.get("/api/tickets/filter", {
    params,
  });

  return response.data;
}