import { Routes, Route } from "react-router-dom";
import Index from "../pages/Index";
import ServiceRequest from "../pages/ServiceRequest";
import Account from "../pages/Account";
import LoginSignup from "../pages/Login";
import EnhancedContractorMain from "../pages/EnhancedContractorMain";
import CustomerDashboard from "../pages/CustomerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import JobDetail from "../pages/JobDetail";
import BookingFlow from "../components/BookingFlow";
import BookingSuccessPage from "../pages/BookingSuccessPage";
import Payment from "../pages/Payment";
import BookingTestComponent from "../components/BookingTestComponent";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/request/:serviceType" element={<ServiceRequest />} />
    <Route path="/service-request" element={<ServiceRequest />} />
    <Route path="/login" element={<LoginSignup />} />
    
    {/* Protected Routes */}
    <Route path="/account" element={
      <ProtectedRoute>
        <Account />
      </ProtectedRoute>
    } />
    
    <Route path="/contractor-main" element={
      <ProtectedRoute requiredUserType="contractor">
        <EnhancedContractorMain />
      </ProtectedRoute>
    } />
    
    <Route path="/customer-dashboard" element={
      <ProtectedRoute requiredUserType="customer">
        <CustomerDashboard />
      </ProtectedRoute>
    } />
    
    {/* Alias route for customer-main */}
    <Route path="/customer-main" element={
      <ProtectedRoute requiredUserType="customer">
        <CustomerDashboard />
      </ProtectedRoute>
    } />
    
    <Route path="/job-detail" element={
      <ProtectedRoute>
        <JobDetail />
      </ProtectedRoute>
    } />
    
    <Route path="/book/:serviceType" element={
      <ProtectedRoute requiredUserType="customer">
        <BookingFlow />
      </ProtectedRoute>
    } />
    
    <Route path="/booking-success" element={
      <ProtectedRoute requiredUserType="customer">
        <BookingSuccessPage />
      </ProtectedRoute>
    } />
    
    <Route path="/booking-test" element={
      <ProtectedRoute>
        <BookingTestComponent />
      </ProtectedRoute>
    } />
    
    <Route path="/payment" element={
      <ProtectedRoute>
        <Payment />
      </ProtectedRoute>
    } />
    
    <Route path="/admin" element={
      <ProtectedRoute requiredUserType="admin">
        <AdminDashboard />
      </ProtectedRoute>
    } />
  </Routes>
);

export default AppRoutes;