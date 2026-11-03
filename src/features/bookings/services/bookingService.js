
import { getResourceById } from './resourceService';

// Temporary in-memory data.
// This resets when the browser refreshes.
// Spring Boot will become the permanent source of truth.

let mockBookings = [
  {
    id: 'BK-1001',
    resourceId: 'RES-001',
    bookingDate: '2026-11-04',
    startTime: '10:00:00',
    endTime: '12:00:00',
    purpose: 'Project development work',
    attendeeCount: 5,
    status: 'CONFIRMED',
    createdAt: '2026-11-02T10:00:00',
  },
  {
    id: 'BK-1002',
    resourceId: 'RES-002',
    bookingDate: '2026-11-05',
    startTime: '14:00:00',
    endTime: '16:00:00',
    purpose: 'Project presentation',
    attendeeCount: 20,
    status: 'PENDING',
    createdAt: '2026-11-02T11:00:00',
  },
];


const timeSlots = [
  ['09:00:00', '10:00:00'],
  ['10:00:00', '11:00:00'],
  ['11:00:00', '12:00:00'],
  ['12:00:00', '13:00:00'],
  ['13:00:00', '14:00:00'],
  ['14:00:00', '15:00:00'],
  ['15:00:00', '16:00:00'],
  ['16:00:00', '17:00:00'],
];

function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export async function getAvailableSlots(resourceId, date) {
  // Future Spring Boot integration:
  // const response = await apiClient.get(
  //   `/api/resources/${resourceId}/availability`,
  //   { params: { date } }
  // );
  // return response.data;

  return timeSlots.map(([startTime, endTime]) => {
    const occupied = mockBookings.some((booking) => {
      if (
        booking.resourceId !== resourceId ||
        booking.bookingDate !== date ||
        !['PENDING', 'CONFIRMED'].includes(booking.status)
      ) {
        return false;
      }

      return isOverlapping(
        startTime,
        endTime,
        booking.startTime,
        booking.endTime
      );
    });

    return {
      startTime,
      endTime,
      available: !occupied,
    };
  });
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
      String(current.getMonth() + 1).padStart(2, '0'),
      String(current.getDate()).padStart(2, '0'),
    ].join('-');

    result[date] = await getAvailableSlots(resourceId, date);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function createBooking(bookingData) {
  const booking = {
    id: `BK-${Date.now()}`,
    ...bookingData,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  mockBookings = [booking, ...mockBookings];

  return booking;
}

export async function getMyBookings() {
  // Future:
  // const response = await apiClient.get('/api/bookings/me');
  // return response.data;

  const bookingsWithResources = await Promise.all(
    mockBookings.map(async (booking) => {
      const resource = await getResourceById(booking.resourceId);

      return {
        ...booking,
        resourceName: resource?.name || 'Unknown resource',
        resourceType: resource?.type || 'Unknown type',
        location: resource
          ? `${resource.building}, ${resource.location}`
          : 'Unknown location',
      };
    })
  );

  return bookingsWithResources;
}

export async function getBookingById(bookingId) {
  const booking = mockBookings.find((item) => item.id === bookingId);

  if (!booking) return null;

  const resource = await getResourceById(booking.resourceId);

  return {
    ...booking,
    resourceName: resource?.name || 'Unknown resource',
    resourceType: resource?.type || 'Unknown type',
    location: resource
      ? `${resource.building}, ${resource.location}`
      : 'Unknown location',
  };
}

export async function cancelBooking(bookingId) {
  // Future:
  // const response = await apiClient.patch(
  //   `/api/bookings/${bookingId}/cancel`
  // );
  // return response.data;

  const booking = mockBookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new Error('This booking cannot be cancelled.');
  }

  booking.status = 'CANCELLED';

  return booking;
}


// Get all bookings for Admin
export async function getAllBookings() {
  const bookingsWithResources = await Promise.all(
    mockBookings.map(async (booking) => {
      const resource = await getResourceById(booking.resourceId);

      return {
        ...booking,
        resourceName: resource?.name || 'Unknown resource',
        resourceType: resource?.type || 'Unknown type',
        location: resource
          ? `${resource.building}, ${resource.location}`
          : 'Unknown location',
      };
    })
  );

  return bookingsWithResources.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Approve or reject a booking
export async function updateBookingStatus(bookingId, newStatus) {
  const booking = mockBookings.find(
    (item) => item.id === bookingId
  );

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.status !== 'PENDING') {
    throw new Error('Only pending bookings can be reviewed.');
  }

  if (!['CONFIRMED', 'REJECTED'].includes(newStatus)) {
    throw new Error('Invalid booking status.');
  }

  // Check for conflicts before approving
  if (newStatus === 'CONFIRMED') {
    const hasConflict = mockBookings.some((other) => {
      if (
        other.id === booking.id ||
        other.resourceId !== booking.resourceId ||
        other.bookingDate !== booking.bookingDate ||
        other.status !== 'CONFIRMED'
      ) {
        return false;
      }

      return isOverlapping(
        booking.startTime,
        booking.endTime,
        other.startTime,
        other.endTime
      );
    });

    if (hasConflict) {
      throw new Error(
        'This resource already has a confirmed booking during that time.'
      );
    }
  }

  booking.status = newStatus;
  return booking;
}
