import apiClient from "../../../services/api/apiClient";
import { getResourceById } from "./resourceService";

// Temporary in-memory data.
// This resets when the browser refreshes.
// Spring Boot will become the permanent source of truth.

const timeSlots = [
  ["09:00:00", "10:00:00"],
  ["10:00:00", "11:00:00"],
  ["11:00:00", "12:00:00"],
  ["12:00:00", "13:00:00"],
  ["13:00:00", "14:00:00"],
  ["14:00:00", "15:00:00"],
  ["15:00:00", "16:00:00"],
  ["16:00:00", "17:00:00"],
];

function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}



export async function getResourceAvailability(resourceId, from, to) {
  const response = await apiClient.get(
    `/api/resources/${resourceId}/availability/week`,
    {
      params: {
        startDate: from,
      },
    }
  );

  const availability = {};

  for (const day of response.data.days || []) {
    availability[day.date] = (day.slots || []).map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: slot.available,
    }));
  }

  return availability;
}

export async function getAvailableSlots(resourceId, date) {
  const availability = await getResourceAvailability(
    resourceId,
    date,
    date
  );

  return availability[date] || [];
}


export async function createBooking(bookingData) {
  const payload = {
    resourceId: bookingData.resourceId,
    purpose: bookingData.purpose,
    attendeeCount: Number(bookingData.attendeeCount),
    startTime: `${bookingData.bookingDate}T${bookingData.startTime}`,
    endTime: `${bookingData.bookingDate}T${bookingData.endTime}`,
  };

  const response = await apiClient.post(
    "/api/resources/bookings",
    payload
  );

  const savedBooking = response.data;

  return {
    ...savedBooking,
    bookingDate: savedBooking.startTime.slice(0, 10),
    startTime: savedBooking.startTime.slice(11, 19),
    endTime: savedBooking.endTime.slice(11, 19),
  };
}


export async function getMyBookings() {
  const response = await apiClient.get("/api/resources/bookings");

  return response.data.map((booking) => ({
    id: booking.id,
    resourceId: booking.resourceId,
    resourceName: booking.resourceName,
    resourceType: null,
    purpose: booking.purpose,
    bookingDate: booking.startTime.slice(0, 10),
    startTime: booking.startTime.slice(11, 19),
    endTime: booking.endTime.slice(11, 19),
    status: booking.status,
    location: null,
    attendeeCount: booking.attendeeCount,
    createdAt: booking.createdAt,
  }));
}
///////////////////////////

export async function getBookingById(bookingId) {
  const bookings = await getMyBookings();

  return bookings.find(
    (booking) => String(booking.id) === String(bookingId)
  ) || null;
}


export async function cancelBooking(bookingId) {
  const response = await apiClient.patch(
    `/api/resources/bookings/${bookingId}/cancel`
  );

  return response.data;
}


// Get all bookings for Admin
// export async function getAllBookings() {
//   const response = await apiClient.get('/api/resources/bookings/all', {
//     params: {
//       collegeId: COLLEGE_ID,
//     },
//   });

//   return response.data.map((booking) => ({
//     id: booking.id,
//     resourceId: booking.resourceId,
//     resourceName: booking.resourceName,
//     bookedBy: booking.bookedBy,
//     requesterName: booking.requesterName,
//     requesterEmail: booking.requesterEmail,
//     purpose: booking.purpose,

//     bookingDate: booking.startTime.slice(0, 10),
//     startTime: booking.startTime.slice(11, 19),
//     endTime: booking.endTime.slice(11, 19),

//     status: booking.status,
//     createdAt: booking.createdAt,
//     attendeeCount: booking.attendeeCount,

//     // These fields are not currently stored in the backend schema.
//     resourceType: null,
//     location: null,
//   }));
// }

export const getAllBookings = async () => {
  const response = await apiClient.get('/api/resources/bookings/all');
  return response.data;
};


// Approve or reject a booking
export const updateBookingStatus = async (
  bookingId,
  status,
  approvalNotes = ''
) => {
  if (!['CONFIRMED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid booking review status');
  }

  const response = await apiClient.patch(
    `/api/resources/bookings/${bookingId}/review`,
    {
      approve: status === 'CONFIRMED',
      approvalNotes
    }
  );

  return response.data;
};
