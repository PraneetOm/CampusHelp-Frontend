
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ResourceDirectory from './features/bookings/pages/ResourceDirectory';
import ResourceDetails from './features/bookings/pages/ResourceDetails';
import BookingForm from './features/bookings/pages/BookingForm';
import MyBookings from './features/bookings/pages/MyBookings';
import ResourceCalendar from './features/bookings/pages/ResourceCalendar';
import BookingDetails from './features/bookings/pages/BookingDetails';
import AdminResources from './features/bookings/pages/AdminResources';
import AdminBookings from './features/bookings/pages/AdminBookings';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<ResourceDirectory />} />
          <Route path="/resources/:resourceId" element={<ResourceDetails />} />
          <Route path="/resources/:resourceId/book" element={<BookingForm />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/availability" element={<ResourceCalendar />} />
          <Route
            path="/bookings/:bookingId"
            element={<BookingDetails />}
          />
          <Route path="/admin/resources" element={<AdminResources />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
