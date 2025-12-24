import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";

export default function Navbar({ onConnect, walletAddress, onDisconnect }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Alpha", path: "/" },
        { name: "Vaults", path: "/vaults" },
        { name: "Strategy", path: "/strategy" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-500 py-4",
                isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                        <ShieldCheck className="text-black w-6 h-6" />
                    </div>
                    <span className="font-orbit text-2xl font-bold tracking-widest text-white uppercase">Zenith</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={cn(
                                "text-sm font-medium tracking-widest uppercase transition-colors hover:text-white",
                                location.pathname === link.path ? "text-white" : "text-zenith-silver/60"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {walletAddress ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-zenith-silver/40 uppercase font-bold tracking-tighter">Connected Account</span>
                                <span className="text-xs font-mono text-white tracking-widest">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </span>
                            </div>
                            <button
                                onClick={onDisconnect}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors group"
                                title="Disconnect"
                            >
                                <LogOut className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onConnect}
                            className="premium-button min-w-[160px]"
                        >
                            <span className="font-bold tracking-widest uppercase text-xs">Login Now</span>
                            <div className="premium-button-text gap-2">
                                <Wallet className="w-4 h-4" />
                                <span className="font-bold tracking-widest uppercase text-xs">Connect</span>
                            </div>
                        </button>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 w-full bg-black border-b border-white/10 p-6 flex flex-col gap-6"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-lg font-bold tracking-widest uppercase text-white"
                            >
                                {link.name}
                            </Link>
                        ))}
                        {!walletAddress && (
                            <button onClick={() => { onConnect(); setMobileMenuOpen(false); }} className="premium-button w-full">
                                <span className="font-bold tracking-widest uppercase text-xs">Login Now</span>
                                <div className="premium-button-text gap-2">
                                    <Wallet className="w-4 h-4" />
                                    <span className="font-bold tracking-widest uppercase text-xs">Connect</span>
                                </div>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
