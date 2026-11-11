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

export async function getAvailableSlots(resourceId, date) {
  const slots = await Promise.all(
    timeSlots.map(async ([startTime, endTime]) => {
      try {
        const response = await apiClient.get(
          `/api/resources/${resourceId}/availability`,
          {
            params: {
              startTime: `${date}T${startTime}`,
              endTime: `${date}T${endTime}`,
            },
          },
        );

        return {
          startTime,
          endTime,
          available: response.data.available,
        };
      } catch (error) {
        console.error(
          `Availability check failed for ${startTime}-${endTime}:`,
          error,
        );

        throw error;
      }
    }),
  );

  return slots;
}

export async function getResourceAvailability(resourceId, from, to) {
  // Future Spring Boot integration:
  // const response = await apiClient.get(
  //   `/api/resources/${resourceId}/availability`,
  //   { params: { from, to } }
  // );
  // return response.data;

  const result = {};
  const current = new Date(`${from}T12:00:00`);
  const last = new Date(`${to}T12:00:00`);

  while (current <= last) {
    const date = [
      current.getFullYear(),
      String(current.getMonth() + 1).padStart(2, "0"),
      String(current.getDate()).padStart(2, "0"),
    ].join("-");

    result[date] = await getAvailableSlots(resourceId, date);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

const COLLEGE_ID = "10000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "5ab79668-ea05-4429-9dfb-e4139be1980b";

export async function createBooking(bookingData) {
  const payload = {
    collegeId: COLLEGE_ID,
    resourceId: bookingData.resourceId,
    bookedBy: DEMO_USER_ID,
    purpose: bookingData.purpose,
    attendeeCount: Number(bookingData.attendeeCount),
    startTime: `${bookingData.bookingDate}T${bookingData.startTime}`,
    endTime: `${bookingData.bookingDate}T${bookingData.endTime}`,
  };

  const response = await apiClient.post("/api/resources/bookings", payload);

  const savedBooking = response.data;

  return {
    ...savedBooking,
    bookingDate: savedBooking.startTime.slice(0, 10),
    startTime: savedBooking.startTime.slice(11, 19),
    endTime: savedBooking.endTime.slice(11, 19),
  };
}


export async function getMyBookings() {
  const response = await apiClient.get('/api/resources/bookings', {
    params: {
      userId: DEMO_USER_ID,
    },
  });

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
    `/api/resources/bookings/${bookingId}/cancel`,
    null,
    {
      params: {
        userId: DEMO_USER_ID,
      },
    }
  );

  return response.data;
}


// Get all bookings for Admin
export async function getAllBookings() {
  const response = await apiClient.get('/api/resources/bookings/all', {
    params: {
      collegeId: COLLEGE_ID,
    },
  });

  return response.data.map((booking) => ({
    id: booking.id,
    resourceId: booking.resourceId,
    resourceName: booking.resourceName,
    bookedBy: booking.bookedBy,
    requesterName: booking.requesterName,
    requesterEmail: booking.requesterEmail,
    purpose: booking.purpose,

    bookingDate: booking.startTime.slice(0, 10),
    startTime: booking.startTime.slice(11, 19),
    endTime: booking.endTime.slice(11, 19),

    status: booking.status,
    createdAt: booking.createdAt,
    attendeeCount: booking.attendeeCount,

    // These fields are not currently stored in the backend schema.
    resourceType: null,
    location: null,
  }));
}


// Approve or reject a booking
export async function updateBookingStatus(bookingId, newStatus) {
  const booking = mockBookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.status !== "PENDING") {
    throw new Error("Only pending bookings can be reviewed.");
  }

  if (!["CONFIRMED", "REJECTED"].includes(newStatus)) {
    throw new Error("Invalid booking status.");
  }

  // Check for conflicts before approving
  if (newStatus === "CONFIRMED") {
    const hasConflict = mockBookings.some((other) => {
      if (
        other.id === booking.id ||
        other.resourceId !== booking.resourceId ||
        other.bookingDate !== booking.bookingDate ||
        other.status !== "CONFIRMED"
      ) {
        return false;
      }

      return isOverlapping(
        booking.startTime,
        booking.endTime,
        other.startTime,
        other.endTime,
      );
    });

    if (hasConflict) {
      throw new Error(
        "This resource already has a confirmed booking during that time.",
      );
    }
  }

  booking.status = newStatus;
  return booking;
}
