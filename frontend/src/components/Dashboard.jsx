import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, Percent, ExternalLink, ShieldCheck, Wallet, ArrowDown, RefreshCw, CheckCircle2, Clock, Info } from "lucide-react";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { formatUnits, parseUnits, parseAbiItem } from "viem";
import { ZENITH_VAULT_ADDRESS, ASSET_ADDRESS, YIELD_MONITOR_ADDRESS, POOL_A_ADDRESS, POOL_B_ADDRESS, VAULT_ABI, MONITOR_ABI, ERC20_ABI, START_BLOCK } from "../config/constants";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { address } = useAccount();
    const navigate = useNavigate();
    const publicClient = usePublicClient();
    const [amount, setAmount] = useState("");
    const [activeTab, setActiveTab] = useState("deposit");
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [lastTxType, setLastTxType] = useState(null);

    const LEDGER_KEY = address ? `zenith_ledger_${address.toLowerCase()}` : null;

    // Contract Reads
    const { data: totalAssets, refetch: refetchVault } = useReadContract({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "totalAssets" });
    const { data: yieldData, refetch: refetchYields } = useReadContract({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "getYieldData" });
    const { data: allocations, refetch: refetchAllocations } = useReadContract({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "getPoolAllocations" });
    const { data: mtkBalance, refetch: refetchMtk } = useReadContract({ address: ASSET_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [address] });
    const { data: zthBalance, refetch: refetchZth } = useReadContract({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "balanceOf", args: [address] });
    const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: ASSET_ADDRESS, abi: ERC20_ABI, functionName: "allowance", args: [address, ZENITH_VAULT_ADDRESS] });

    const { writeContractAsync } = useWriteContract();
    const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    const fetchActivities = useCallback(async (isSilent = false) => {
        if (!publicClient || !address || !LEDGER_KEY) return;
        if (!isSilent) setIsLoadingActivities(true);

        try {
            const currentBlock = await publicClient.getBlockNumber();
            // Use a sliding window of 25,000 blocks. This is enough for a demo and prevents RPC timeouts.
            const fromBlock = currentBlock - 25000n > START_BLOCK ? currentBlock - 25000n : START_BLOCK;

            const [depositLogs, withdrawLogs, rebalanceLogs] = await Promise.all([
                publicClient.getLogs({
                    address: ZENITH_VAULT_ADDRESS,
                    event: parseAbiItem('event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)'),
                    fromBlock,
                    toBlock: 'latest',
                }),
                publicClient.getLogs({
                    address: ZENITH_VAULT_ADDRESS,
                    event: parseAbiItem('event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'),
                    fromBlock,
                    toBlock: 'latest',
                }),
                publicClient.getLogs({
                    address: ZENITH_VAULT_ADDRESS,
                    event: parseAbiItem('event Rebalanced(address indexed fromPool, address indexed toPool, uint256 amount)'),
                    fromBlock,
                    toBlock: 'latest',
                })
            ]);

            const userOnchain = [
                ...depositLogs.filter(log => log.args.sender?.toLowerCase() === address.toLowerCase() || log.args.owner?.toLowerCase() === address.toLowerCase()).map(log => ({
                    hash: log.transactionHash,
                    type: "Deposit",
                    status: "Confirmed",
                    val: `+${parseFloat(formatUnits(log.args.assets || 0n, 18)).toFixed(2)} MTK`,
                    blockNumber: log.blockNumber,
                    timestamp: 0
                })),
                ...withdrawLogs.filter(log => log.args.sender?.toLowerCase() === address.toLowerCase() || log.args.receiver?.toLowerCase() === address.toLowerCase() || log.args.owner?.toLowerCase() === address.toLowerCase()).map(log => ({
                    hash: log.transactionHash,
                    type: "Withdraw",
                    status: "Confirmed",
                    val: `-${parseFloat(formatUnits(log.args.assets || 0n, 18)).toFixed(2)} MTK`,
                    blockNumber: log.blockNumber,
                    timestamp: 0
                })),
                ...rebalanceLogs.map(log => ({
                    hash: log.transactionHash,
                    type: "Rebalance",
                    status: "Optimized",
                    val: `${parseFloat(formatUnits(log.args.amount || 0n, 18)).toFixed(2)} MTK`,
                    blockNumber: log.blockNumber,
                    timestamp: 0
                }))
            ];

            const local = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
            const onchainHashes = new Set(userOnchain.map(o => o.hash.toLowerCase()));

            // Keep pending items only if not on-chain and not older than 1 hour
            const stillPending = local.filter(l => {
                const isFound = onchainHashes.has(l.hash.toLowerCase());
                const isRecent = Date.now() - l.timestamp < 3600000;
                return !isFound && isRecent;
            });

            localStorage.setItem(LEDGER_KEY, JSON.stringify(stillPending));

            const combined = [...stillPending, ...userOnchain];
            combined.sort((a, b) => {
                if (a.status === "Pending" && b.status !== "Pending") return -1;
                if (b.status === "Pending" && a.status !== "Pending") return 1;
                if (a.status === "Pending" && b.status === "Pending") return b.timestamp - a.timestamp;
                return Number(b.blockNumber || 0) - Number(a.blockNumber || 0);
            });

            setActivities(combined.slice(0, 15));
        } catch (e) {
            console.error("Ledger Sync Error (likely RPC limit):", e);
            // If the sliding window also fails, try a smaller one (last 5000 blocks)
            if (LEDGER_KEY) {
                const local = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
                setActivities(local.slice(0, 10));
            }
        }
        setIsLoadingActivities(false);
    }, [publicClient, address, LEDGER_KEY]);

    useEffect(() => {
        if (!address) { setActivities([]); return; }
        fetchActivities();
        const interval = setInterval(() => fetchActivities(true), 15000);
        return () => clearInterval(interval);
    }, [address, fetchActivities]);

    useEffect(() => {
        if (isTxConfirmed) {
            refetchVault(); refetchYields(); refetchAllocations(); refetchMtk(); refetchZth(); refetchAllowance();
            fetchActivities(true);
            if (lastTxType !== 'approve') setAmount("");
            setIsProcessing(false); setTxHash(null); setLastTxType(null);
        }
    }, [isTxConfirmed, lastTxType]);

    const savePending = (hash, type, val) => {
        if (!LEDGER_KEY) return;
        const local = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
        const entry = { hash, type, val, status: "Pending", timestamp: Date.now() };
        localStorage.setItem(LEDGER_KEY, JSON.stringify([entry, ...local].slice(0, 20)));
        setActivities(prev => {
            const filtered = prev.filter(p => p.hash.toLowerCase() !== hash.toLowerCase());
            return [entry, ...filtered].slice(0, 15);
        });
    };

    const handleAction = async () => {
        if (!amount || isProcessing) return;
        setIsProcessing(true);
        try {
            const val = parseUnits(amount, 18);
            if (activeTab === "deposit") {
                if (!allowance || allowance < val) {
                    setLastTxType('approve');
                    const hash = await writeContractAsync({ address: ASSET_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [ZENITH_VAULT_ADDRESS, val] });
                    setTxHash(hash);
                    savePending(hash, "Approve", `${amount} MTK`);
                } else {
                    setLastTxType('deposit');
                    const hash = await writeContractAsync({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "deposit", args: [val, address] });
                    setTxHash(hash);
                    savePending(hash, "Deposit", `${amount} MTK`);
                }
            } else {
                setLastTxType('withdraw');
                const hash = await writeContractAsync({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "redeem", args: [val, address, address] });
                setTxHash(hash);
                savePending(hash, "Withdraw", `${amount} MTK`);
            }
        } catch (e) {
            console.error(e); setIsProcessing(false); setLastTxType(null);
        }
    };

    const handleRebalance = async () => {
        try {
            const hash = await writeContractAsync({ address: ZENITH_VAULT_ADDRESS, abi: VAULT_ABI, functionName: "checkYieldsAndRebalance" });
            setTxHash(hash); setLastTxType('rebalance'); setIsProcessing(true);
            savePending(hash, "Rebalance", "System");
        } catch (e) { console.error(e); }
    };

    const stats = [
        { label: "Total Value Locked (TVL)", val: totalAssets ? `${parseFloat(formatUnits(totalAssets, 18)).toFixed(2)} MTK` : "0.00 MTK", change: "VERIFIED", icon: TrendingUp },
        { label: "Current Yield (APY)", val: yieldData ? `${(Number(yieldData.poolAApy) / 100).toFixed(2)}%` : "0.00%", change: yieldData ? `${(Number(yieldData.yieldDifference) / 100).toFixed(2)}% DIFF` : "...", icon: Percent },
        { label: "Vault Status", val: "OPTIMIZED", change: "REACTIVE", icon: Activity },
    ];

    return (
        <div className="pt-32 pb-20 min-h-screen relative overflow-hidden bg-zenith-950">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Verifiable On-Chain State
                        </div>
                        <h2 className="text-4xl md:text-5xl font-orbit font-bold tracking-tighter uppercase text-white">
                            Alpha <span className="text-gradient">Vault</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/faucet")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Request MTK Token</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="premium-card group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-white/10 text-white uppercase tracking-tighter">
                                    {stat.change}
                                </span>
                            </div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1 relative z-10">{stat.label}</div>
                            <div className="text-3xl font-orbit font-bold text-white tracking-tight relative z-10">{stat.val}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 premium-card flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40">Portfolio Distribution</h3>
                            <a href={`https://sepolia.etherscan.io/address/${ZENITH_VAULT_ADDRESS}`} target="_blank" className="text-[10px] uppercase font-bold text-white/20 hover:text-white transition-colors flex items-center gap-1" rel="noreferrer">
                                Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="space-y-10 flex-grow">
                            {allocations?.map((pool, i) => {
                                const isPoolA = pool.poolAddress.toLowerCase() === POOL_A_ADDRESS.toLowerCase();
                                const poolName = isPoolA ? "Aave V3" : "Compound V2";
                                return (
                                    <div key={i} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-orbit font-bold text-xs text-white/60">{isPoolA ? "A" : "B"}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-white mb-0.5 uppercase tracking-widest">{poolName}</div>
                                                    <div className="text-xs font-mono text-white/30 tracking-tighter">{pool.poolAddress?.slice(0, 10)}...{pool.poolAddress?.slice(-4)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Target Weight</div>
                                                <div className="text-xl font-orbit font-bold text-white tracking-widest">{Number(pool.percentage) / 100}%</div>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Number(pool.percentage) / 100}%` }} className="h-full bg-white/40 rounded-full" />
                                        </div>
                                    </div>
                                );
                            }) || <div className="text-center py-20 text-white/10 uppercase tracking-widest animate-pulse">Scanning Protocols...</div>}
                        </div>
                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                                    <Activity className="w-6 h-6 text-white/40 animate-pulse" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest">Autonomous Rebalancing</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 max-w-sm">The Reactive Network optimizes yield across protocols. Target: <span className="text-white/60 font-bold">{Number(yieldData?.poolAApy) > Number(yieldData?.poolBApy) ? "Pool A" : "Pool B"}</span></div>
                                </div>
                            </div>
                            <button onClick={handleRebalance} disabled={isProcessing} className="h-12 px-8 rounded-xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-zenith-silver hover:scale-[1.02] transition-all shadow-xl flex items-center gap-2">
                                Execute Rebalance <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="premium-card flex flex-col relative overflow-hidden">
                        <div className="mb-8">
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-8">Personal Terminal</h3>
                            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-4">
                                <button onClick={() => setActiveTab("deposit")} className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", activeTab === "deposit" ? "bg-white text-black font-black" : "text-white/40 hover:text-white")}>Deposit</button>
                                <button onClick={() => setActiveTab("withdraw")} className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", activeTab === "withdraw" ? "bg-white text-black font-black" : "text-white/40 hover:text-white")}>Withdraw</button>
                            </div>

                            <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Vault Shares (ZTH)
                                </div>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">MTK is your asset. ZTH represents your ownership + yield. Withdraw anytime.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Target Amount</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Balance: {activeTab === "deposit" ? parseFloat(formatUnits(mtkBalance || 0n, 18)).toFixed(2) : parseFloat(formatUnits(zthBalance || 0n, 18)).toFixed(2)} {activeTab === "deposit" ? "MTK" : "ZTH"}</span>
                                    </div>
                                    <div className="relative group">
                                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xl font-orbit font-bold text-white focus:border-white/30 transition-all outline-none" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20 uppercase tracking-widest">{activeTab === "deposit" ? "MTK" : "ZTH"}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                    {activeTab === "deposit" && Number(amount) > 0 && (!allowance || allowance < parseUnits(amount, 18)) && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">
                                            <Activity className="w-3 h-3 animate-pulse" /> Step 1: Authorization Needed
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[10px]"><span className="text-white/20 uppercase font-bold tracking-widest">Protocol Fee</span><span className="text-white/80 font-bold">0.00%</span></div>
                                    <div className="h-[1px] bg-white/5" />
                                    <div className="flex justify-between items-center text-xs"><span className="text-white/60 font-orbit uppercase font-bold">Benefit Received</span><span className="text-white font-orbit font-bold">{amount || "0.00"}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto space-y-4">
                            <button onClick={handleAction} disabled={!amount || isProcessing} className="w-full h-14 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zenith-silver transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50">
                                <span>{isProcessing ? "Transacting..." : (activeTab === "deposit" ? ((!allowance || allowance < parseUnits(amount || "0", 18)) ? "Authorize MTK" : "Deposit MTK") : "Withdraw MTK")}</span>
                                <Wallet className="w-4 h-4" />
                            </button>
                            {isTxConfirmed && <div className="text-center text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</div>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 premium-card">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 flex items-center gap-2 text-white">Activity Ledger</h3>
                            <div className="text-[9px] text-white/20 uppercase tracking-widest mt-1">On-chain persistence from <span className="text-white/40">Block #{START_BLOCK.toString()}</span></div>
                        </div>
                        <button onClick={() => fetchActivities()} disabled={isLoadingActivities} className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <RefreshCw className={cn("w-3 h-3", isLoadingActivities && "animate-spin")} />
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Sync Ledger</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {activities.length === 0 && !isLoadingActivities ? (
                            <div className="text-center py-12 text-white/10 uppercase tracking-widest">No activity detected on this account</div>
                        ) : activities.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        {tx.status === "Pending" ? <Clock className="w-4 h-4 animate-pulse text-yellow-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-white uppercase tracking-widest mb-0.5">{tx.type} {tx.status === "Pending" && <span className="text-yellow-500 text-[8px] ml-2 font-black">PENDING</span>}</div>
                                        <div className="text-[9px] text-white/20 font-mono italic">{tx.hash.slice(0, 16)}...</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right hidden md:block">
                                        <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">{tx.val}</div>
                                        <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold">{tx.status} {tx.blockNumber && `• #${tx.blockNumber}`}</div>
                                    </div>
                                    <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all" rel="noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
