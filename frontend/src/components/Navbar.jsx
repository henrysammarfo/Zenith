import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";
import { cn } from "../lib/utils";

export default function Navbar() {
    const { isConnected } = useAccount();
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

    const navLinks = isConnected ? [
        { name: "Home", path: "/" },
        { name: "Dashboard", path: "/dashboard" },
    ] : [];

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-[100] transition-all duration-500 py-4",
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

                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            mounted,
                        }) => {
                            const ready = mounted;
                            const connected = ready && account && chain;

                            return (
                                <div
                                    {...(!ready && {
                                        'aria-hidden': true,
                                        'style': {
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        },
                                    })}
                                >
                                    {(() => {
                                        if (!connected) {
                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    type="button"
                                                    className="relative h-12 px-10 rounded-xl bg-white text-black font-black text-[12px] uppercase tracking-widest hover:bg-zenith-silver hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden group"
                                                >
                                                    <span className="relative z-10">Connect Wallet</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                </button>
                                            );
                                        }

                                        if (chain.unsupported) {
                                            return (
                                                <button onClick={openChainModal} type="button" className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                                                    Wrong Network
                                                </button>
                                            );
                                        }

                                        return (
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button
                                                    onClick={openChainModal}
                                                    style={{ display: 'flex', alignItems: 'center' }}
                                                    type="button"
                                                    className="px-4 py-2.5 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zenith-silver transition-all shadow-lg"
                                                >
                                                    {chain.hasIcon && (
                                                        <div
                                                            style={{
                                                                background: chain.iconBackground,
                                                                width: 14,
                                                                height: 14,
                                                                borderRadius: 999,
                                                                overflow: 'hidden',
                                                                marginRight: 6,
                                                                border: '1px solid rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            {chain.iconUrl && (
                                                                <img
                                                                    alt={chain.name ?? 'Chain icon'}
                                                                    src={chain.iconUrl}
                                                                    style={{ width: 14, height: 14 }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    {chain.name}
                                                </button>

                                                <button
                                                    onClick={openAccountModal}
                                                    type="button"
                                                    className="px-6 py-3 rounded-xl bg-white text-black font-black text-[12px] uppercase tracking-widest hover:bg-zenith-silver transition-all shadow-lg"
                                                >
                                                    {account.displayName}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>

                <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 w-full bg-black border-b border-white/10 p-6 flex flex-col gap-6"
                    >
                        {navLinks.map((link) => (
                            <Link key={link.name} to={link.path} onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold tracking-widest uppercase text-white">
                                {link.name}
                            </Link>
                        ))}
                        <div className="flex justify-center mt-4">
                            <ConnectButton.Custom>
                                {({ account, chain, openConnectModal, mounted }) => {
                                    const ready = mounted;
                                    const connected = ready && account && chain;
                                    if (!connected) {
                                        return (
                                            <button
                                                onClick={openConnectModal}
                                                className="w-full h-12 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest shadow-lg"
                                            >
                                                Connect Wallet
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            onClick={() => openConnectModal()}
                                            className="w-full h-12 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-widest"
                                        >
                                            {account.displayName}
                                        </button>
                                    );
                                }}
                            </ConnectButton.Custom>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
