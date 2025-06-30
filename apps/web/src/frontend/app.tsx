import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Docs, Examples, Home } from "@/components/boilerplate";
import Navbar from "@/components/layout/Navbar";
import NotFound from "./components/NotFound";
import TestAuthPage from "@/app/dev-dashboard/page"; // Import the dev dashboard page

export default function App() {
  return (
    <BrowserRouter>
      {/* Temporarily remove h-[100dvh] for scroll debugging */}
      <div className="flex w-screen max-w-full flex-col bg-background">
        <Navbar />
        {/* The main element will handle its own scrolling, ensure it has enough height */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 min-h-screen">
          {" "}
          {/* Added min-h-screen here */}
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/examples" element={<Examples />} />
              <Route path="/dev-dashboard" element={<TestAuthPage />} />{" "}
              {/* Add dev-dashboard route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
