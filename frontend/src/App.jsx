import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AuthGuard from "./components/AuthGuard";
import Dashboard from "./components/Dashboard";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);

  // Mock Wallet Connection
  const connectWallet = () => {
    // Simulate a connection
    const mockAddress = "0x8f361be3...6448";
    setWalletAddress(mockAddress);
    localStorage.setItem("zenith_wallet", mockAddress);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("zenith_wallet");
  };

  useEffect(() => {
    const saved = localStorage.getItem("zenith_wallet");
    if (saved) setWalletAddress(saved);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-zenith-950 selection:bg-white selection:text-black">
        <Navbar
          walletAddress={walletAddress}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />

        <Routes>
          <Route path="/" element={
            walletAddress ? <Navigate to="/dashboard" /> : <Hero onStart={connectWallet} />
          } />

          <Route path="/dashboard" element={
            <AuthGuard walletAddress={walletAddress}>
              <Dashboard />
            </AuthGuard>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <footer className="py-20 border-t border-white/5 mt-20">
          <div className="container mx-auto px-6 text-center">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/20">
              Zenith Protocol &copy; 2024 &mdash; The Standard of Cross-Chain Automation
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
