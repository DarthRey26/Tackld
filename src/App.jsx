import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceRequest from "./pages/ServiceRequest";
import Account from "./pages/Account";
import Header from "./components/Header";
import LoginSignup from "./pages/Login";
import ContractorMain from "./pages/ContractorMain";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/request/:serviceId" element={<ServiceRequest />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/contractor-main" element={<ContractorMain />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;