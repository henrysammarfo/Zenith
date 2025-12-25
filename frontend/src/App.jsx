import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AuthGuard from "./components/AuthGuard";
import Dashboard from "./components/Dashboard";
import Faucet from "./pages/Faucet";

function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <Router>
      <div className="min-h-screen bg-zenith-950 selection:bg-white selection:text-black">
        <Navbar
          walletAddress={address}
          onDisconnect={() => disconnect()}
        />

        <Routes>
          <Route path="/" element={
            isConnected ? <Navigate to="/dashboard" /> : <Hero />
          } />

          <Route path="/dashboard" element={
            <AuthGuard walletAddress={address}>
              <Dashboard />
            </AuthGuard>
          } />

          <Route path="/faucet" element={<Faucet />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <footer className="py-20 border-t border-white/5 mt-20 bg-black/40 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <span className="text-[11px] font-black tracking-[0.4em] uppercase text-white mb-4 block drop-shadow-lg">
              The Zenith of Autonomous Yield
            </span>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/90">
              Zenith Protocol &copy; 2025
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
