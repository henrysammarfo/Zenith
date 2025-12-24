import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, Activity, Percent, ArrowLeftRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function Dashboard() {
    const stats = [
        { label: "Total Value Locked", val: "$1,438,290", change: "+12.5%", icon: TrendingUp },
        { label: "Active Yield (APY)", val: "7.82%", change: "+0.4%", icon: Percent },
        { label: "Optimized Rate", val: "99.8%", change: "MAX", icon: Activity },
    ];

    const allocations = [
        { name: "Aave V3", amount: "0.85 ETH", pct: 70, color: "bg-white" },
        { name: "Compound V2", amount: "0.38 ETH", pct: 30, color: "bg-white/20" },
    ];

    return (
        <div className="pt-32 pb-20 min-h-screen">
            <div className="container mx-auto px-6">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-2"
                        >
                            System Status: Reactive
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-orbit font-bold tracking-tighter uppercase"
                        >
                            Alpha <span className="text-gradient">Vault</span>
                        </motion.h2>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4"
                    >
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Sepolia Mainnet</span>
                        </div>
                        <button className="text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors">
                            Refresh Data
                        </button>
                    </motion.div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="premium-card group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-md bg-white/10",
                                    stat.change.includes("+") ? "text-green-400" : "text-white"
                                )}>
                                    {stat.change}
                                </span>
                            </div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1">{stat.label}</div>
                            <div className="text-3xl font-orbit font-bold text-white tracking-tight">{stat.val}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Allocation Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 premium-card"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40">Real-time Allocation</h3>
                            <ArrowLeftRight className="w-4 h-4 text-white/20" />
                        </div>

                        <div className="space-y-8">
                            {allocations.map((pool, i) => (
                                <div key={pool.name} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-sm font-bold text-white mb-1 uppercase tracking-widest">{pool.name}</div>
                                            <div className="text-2xl font-orbit font-bold text-white/80 tracking-tighter">{pool.amount}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Target Weight</div>
                                            <div className="text-lg font-orbit font-bold text-white tracking-widest">{pool.pct}%</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pool.pct}%` }}
                                            transition={{ duration: 1, delay: 0.6 + (i * 0.2) }}
                                            className={cn("h-full", pool.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-white/40" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest">Next Auto-Rebalance</div>
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Estimating optimal shift...</div>
                                </div>
                            </div>
                            <button className="premium-button min-w-[200px]">
                                <span className="font-bold tracking-widest uppercase text-xs">Trigger Manual</span>
                                <div className="premium-button-text gap-2">
                                    <span className="font-bold tracking-widest uppercase text-xs">Execute Shift</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* Action Center */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="premium-card flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-8">Asset Control</h3>
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-white border border-white text-black">
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Your Balance</div>
                                    <div className="text-3xl font-orbit font-bold tracking-tighter">1.23 ETH</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-40">Monthly Earnings</div>
                                    <div className="text-xl font-orbit font-bold tracking-tighter text-gradient">+0.09 ETH</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mt-12">
                            <button className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zenith-silver transition-colors">
                                Deposit ETH
                            </button>
                            <button className="w-full py-4 rounded-xl bg-transparent border border-white/10 text-white/60 font-bold uppercase tracking-widest text-xs hover:text-white hover:border-white transition-all">
                                Withdraw Shares
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
