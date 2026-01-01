import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplet, Timer, ShieldCheck, Wallet, ArrowRight, ExternalLink } from "lucide-react";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ASSET_ADDRESS, ERC20_ABI } from "../config/constants";
import { cn } from "../lib/utils";

export default function Faucet() {
    const { address, isConnected } = useAccount();
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const { data: lastClaim, refetch: refetchLastClaim } = useReadContract({
        address: ASSET_ADDRESS,
        abi: ERC20_ABI,
        functionName: "lastClaimTime",
        args: [address],
    });

    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: ASSET_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
    });

    const { writeContractAsync } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isSuccess) {
            refetchBalance();
            refetchLastClaim();
            setIsProcessing(false);
            setTxHash(null);
        }
    }, [isSuccess]);

    useEffect(() => {
        if (lastClaim) {
            const timer = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const nextClaim = Number(lastClaim) + 86400; // 24h
                const remaining = nextClaim - now;
                setTimeLeft(remaining > 0 ? remaining : 0);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lastClaim]);

    const handleClaim = async () => {
        try {
            setIsProcessing(true);
            const hash = await writeContractAsync({
                address: ASSET_ADDRESS,
                abi: ERC20_ABI,
                functionName: "claimFaucet",
            });
            setTxHash(hash);
        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="pt-32 pb-20 min-h-screen relative overflow-hidden mesh-bg">
            <div className="container mx-auto px-6 relative z-10 max-w-4xl">
                <header className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6"
                    >
                        <Droplet className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-white">Organic Distribution Portal</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-orbit font-bold tracking-tighter uppercase mb-6"
                    >
                        Token <span className="text-gradient">Faucet</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold"
                    >
                        Claim 100 MTK every 24 hours to fuel your vault operations.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="premium-card flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-orbit font-bold text-white mb-2 uppercase italic">Personal Reserve</h3>
                            <div className="text-4xl font-orbit font-black text-white tracking-widest mb-4">
                                {balance ? formatUnits(balance, 18) : "0.00"} <span className="text-white/20">MTK</span>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                            {isConnected ? `Linked To: ${address.slice(0, 6)}...${address.slice(-4)}` : "Disconnected Portfolio"}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="premium-card"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Timer className={cn("w-6 h-6 text-white", timeLeft > 0 && "animate-pulse")} />
                            </div>
                            {timeLeft > 0 ? (
                                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase">
                                    Cooldown: {formatTime(timeLeft)}
                                </div>
                            ) : (
                                <div className="px-3 py-1 rounded bg-green-500/20 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase">
                                    Ready to Claim
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl font-orbit font-bold text-white mb-6 uppercase">Daily Distribution</h3>

                        <button
                            onClick={handleClaim}
                            disabled={!isConnected || isProcessing || timeLeft > 0}
                            className="relative w-full h-16 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-zenith-silver disabled:opacity-20 disabled:grayscale transition-all shadow-2xl flex items-center justify-center gap-3 group overflow-hidden"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Claim 100 MTK
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="mt-6 text-[9px] text-center text-white/20 uppercase tracking-widest leading-relaxed">
                            A 24-hour cooldown applies to all claims. <br />
                            Maximum supply is fixed at 100,000,000 MTK.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
