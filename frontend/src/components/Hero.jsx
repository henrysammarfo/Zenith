import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";

export default function Hero() {
    const { isConnected } = useAccount();
    const navigate = useNavigate();

    const handleAction = (openConnectModal) => {
        if (isConnected) {
            navigate("/dashboard");
        } else {
            openConnectModal();
        }
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-bg pt-20">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-[120px]" />
            </div>

            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-zenith-950 via-zenith-950/80 to-transparent z-10 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-30">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/40 mb-8"
                    >
                        <Zap className="w-4 h-4 text-white" />
                        <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white">
                            Reactive Yield Protocol Live
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-orbit font-bold tracking-tighter mb-8 leading-[0.9]"
                    >
                        THE <span className="text-gradient">ZENITH</span> OF <br />
                        AUTONOMOUS <br />
                        YIELD.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Elevate your liquidity. Zenith rebalances between elite lending protocols
                        using the Reactive Network—ensuring you're always at the peak of performance.
                    </motion.p>

                    <ConnectButton.Custom>
                        {({ mounted, openConnectModal }) => {
                            const ready = mounted;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.6 }}
                                    className="flex flex-col md:flex-row items-center justify-center gap-6"
                                    style={{
                                        opacity: ready ? 1 : 0,
                                        pointerEvents: ready ? 'auto' : 'none',
                                    }}
                                >
                                    <button
                                        onClick={() => handleAction(openConnectModal)}
                                        className="relative h-16 px-12 rounded-full bg-white text-black font-black text-base uppercase tracking-widest hover:bg-zenith-silver hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] group overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {isConnected ? "Enter the Vault" : "Connect Wallet"}
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </button>
                                </motion.div>
                            );
                        }}
                    </ConnectButton.Custom>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-white/5 relative"
                    >
                        <div className="absolute -top-[1px] left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        {[
                            { label: "Asset", val: "MTK/ETH", icon: ShieldCheck },
                            { label: "Automation", val: "Passive", icon: Zap },
                            { label: "Network", val: "Sepolia", icon: TrendingUp },
                            { label: "Node", val: "Verified", icon: ShieldCheck },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
                                <stat.icon className="w-5 h-5 text-white active:scale-110 transition-all duration-300" />
                                <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white drop-shadow-md">{stat.label}</span>
                                <span className="text-2xl font-orbit font-black text-white tracking-widest uppercase drop-shadow-xl">{stat.val}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
