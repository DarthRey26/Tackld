import { Routes, Route } from "react-router-dom";
import Index from "../pages/Index"; // Adjust path as necessary
import ServiceRequest from "../pages/ServiceRequest"; // Add other routes as needed
import Account from "../pages/Account"; // Add other routes as needed
import LoginSignup from "../pages/Login"; // Add other routes as needed
import ContractorMain from "../pages/ContractorMain"; // Add this or other routes
import CustomerMain from "../pages/CustomerMain"; // Add this or other routes
import JobDetail from "../pages/JobDetail"; // Add this or other routes

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/request/:serviceId" element={<ServiceRequest />} />
    <Route path="/account" element={<Account />} />
    <Route path="/login" element={<LoginSignup />} />
    <Route path="/contractor-main" element={<ContractorMain />} />
    <Route path="/customer-main" element={<CustomerMain />} />
    <Route path="/job-detail" element={<JobDetail />} />
  </Routes>
);

export default AppRoutes;
