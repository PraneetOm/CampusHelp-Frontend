import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";

import Login from "./features/auth/pages/Login";
import Dashboard from "./pages/Dashboard";

import ResourceDirectory from "./features/bookings/pages/ResourceDirectory";
import ResourceDetails from "./features/bookings/pages/ResourceDetails";
import BookingForm from "./features/bookings/pages/BookingForm";
import MyBookings from "./features/bookings/pages/MyBookings";
import ResourceCalendar from "./features/bookings/pages/ResourceCalendar";
import BookingDetails from "./features/bookings/pages/BookingDetails";

import AdminResources from "./features/bookings/pages/AdminResources";
import AdminBookings from "./features/bookings/pages/AdminBookings";

function ProtectedApplication() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/resources" element={<ResourceDirectory />} />
          <Route
            path="/resources/:resourceId"
            element={<ResourceDetails />}
          />
          <Route
            path="/resources/:resourceId/book"
            element={<BookingForm />}
          />

          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/availability" element={<ResourceCalendar />} />

          <Route
            path="/bookings/:bookingId"
            element={<BookingDetails />}
          />

          <Route
            path="/admin/resources"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminResources />
              </RoleBasedRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminBookings />
              </RoleBasedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedApplication />} />
      </Routes>
    </BrowserRouter>
  );
}