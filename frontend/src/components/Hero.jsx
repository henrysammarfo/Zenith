import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Zap, ArrowRight } from "lucide-react";

export default function Hero({ onStart }) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-bg pt-20">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                    >
                        <Zap className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60">
                            Reactive Yield Protocol Live
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-orbit font-bold tracking-tighter mb-8 leading-[0.9]"
                    >
                        THE <span className="text-gradient">ZENITH</span> OF <br />
                        AUTONOMOUS <br />
                        YIELD.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="text-xl text-zenith-silver/60 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Elevate your liquidity. Zenith rebalances between elite lending protocols
                        using the Reactive Network—ensuring you're always at the peak of performance.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6"
                    >
                        <button onClick={onStart} className="premium-button min-w-[240px]">
                            <span className="font-bold tracking-[0.2em] uppercase">Enter the Vault</span>
                            <div className="premium-button-text gap-2">
                                <span className="font-bold tracking-[0.2em] uppercase">Launch App</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                        <button className="text-sm font-bold tracking-[0.3em] uppercase text-white hover:text-zenith-silver transition-colors">
                            Read the strategy
                        </button>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-white/5"
                    >
                        {[
                            { label: "Network", val: "Lasna", icon: ShieldCheck },
                            { label: "Automation", val: "100%", icon: Zap },
                            { label: "Protocols", val: "Aave/Comp", icon: TrendingUp },
                            { label: "Status", val: "Optimized", icon: ShieldCheck },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <stat.icon className="w-4 h-4 text-white/40" />
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">{stat.label}</span>
                                <span className="text-lg font-orbit font-bold text-white tracking-widest uppercase">{stat.val}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
