import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, Percent, ExternalLink, ShieldCheck, Wallet, ArrowDown, RefreshCw } from "lucide-react";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { formatUnits, parseUnits, parseAbiItem } from "viem";
import { ZENITH_VAULT_ADDRESS, ASSET_ADDRESS, VAULT_ABI, ERC20_ABI } from "../config/constants";
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

    // Read Vault Total Balance / TVL
    const { data: totalAssets, refetch: refetchVault } = useReadContract({
        address: ZENITH_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "totalAssets",
    });

    // Read Real-time Yield Data
    const { data: yieldData, refetch: refetchYields } = useReadContract({
        address: ZENITH_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getYieldData",
    });

    // Read Allocations
    const { data: allocations, refetch: refetchAllocations } = useReadContract({
        address: ZENITH_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getPoolAllocations",
    });

    // Read Personal Balances
    const { data: mtkBalance, refetch: refetchMtk } = useReadContract({
        address: ASSET_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
    });

    const { data: zthBalance, refetch: refetchZth } = useReadContract({
        address: ZENITH_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: [address],
    });

    // Read Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: ASSET_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, ZENITH_VAULT_ADDRESS],
    });

    const { writeContractAsync } = useWriteContract();

    const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Fetch real activity logs from blockchain
    const fetchActivities = useCallback(async () => {
        if (!publicClient || !address) return;
        setIsLoadingActivities(true);

        try {
            const currentBlock = await publicClient.getBlockNumber();
            // Fetch last ~5000 blocks to avoid RPC limits
            const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n;

            // Fetch ALL Deposit events from the vault (then filter client-side)
            const depositLogs = await publicClient.getLogs({
                address: ZENITH_VAULT_ADDRESS,
                event: parseAbiItem('event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)'),
                fromBlock,
                toBlock: 'latest',
            });

            // Fetch ALL Withdraw events from the vault (then filter client-side)
            const withdrawLogs = await publicClient.getLogs({
                address: ZENITH_VAULT_ADDRESS,
                event: parseAbiItem('event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'),
                fromBlock,
                toBlock: 'latest',
            });

            // Fetch all Rebalanced events (protocol-wide)
            const rebalanceLogs = await publicClient.getLogs({
                address: ZENITH_VAULT_ADDRESS,
                event: parseAbiItem('event Rebalanced(address indexed fromPool, address indexed toPool, uint256 amount)'),
                fromBlock,
                toBlock: 'latest',
            });

            // Filter deposits where user is sender OR owner
            const userDeposits = depositLogs.filter(log =>
                log.args.sender?.toLowerCase() === address.toLowerCase() ||
                log.args.owner?.toLowerCase() === address.toLowerCase()
            );

            // Filter withdraws where user is sender, receiver, OR owner
            const userWithdraws = withdrawLogs.filter(log =>
                log.args.sender?.toLowerCase() === address.toLowerCase() ||
                log.args.receiver?.toLowerCase() === address.toLowerCase() ||
                log.args.owner?.toLowerCase() === address.toLowerCase()
            );

            // Combine and format all events
            const allActivities = [
                ...userDeposits.map(log => ({
                    type: "Deposit",
                    status: "Confirmed",
                    hash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    val: `+${parseFloat(formatUnits(log.args.assets || 0n, 18)).toFixed(2)} MTK`,
                })),
                ...userWithdraws.map(log => ({
                    type: "Withdraw",
                    status: "Confirmed",
                    hash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    val: `-${parseFloat(formatUnits(log.args.assets || 0n, 18)).toFixed(2)} MTK`,
                })),
                ...rebalanceLogs.map(log => ({
                    type: "Rebalance",
                    status: "Optimized",
                    hash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    val: `${parseFloat(formatUnits(log.args.amount || 0n, 18)).toFixed(2)} MTK`,
                })),
            ];

            // Sort by block number descending (newest first)
            allActivities.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

            setActivities(allActivities.slice(0, 10)); // Show last 10
        } catch (e) {
            console.error("Failed to fetch activities:", e);
            setActivities([]);
        }
        setIsLoadingActivities(false);
    }, [publicClient, address]);


    useEffect(() => {
        fetchActivities();
    }, [fetchActivities, address]);

    useEffect(() => {
        if (isTxConfirmed) {
            refetchVault();
            refetchYields();
            refetchAllocations();
            refetchMtk();
            refetchZth();
            refetchAllowance();
            fetchActivities(); // Refresh activity log
            setIsProcessing(false);
            setTxHash(null);
            setAmount("");
        }
    }, [isTxConfirmed]);

    const stats = [
        {
            label: "Total Value Locked (TVL)",
            val: totalAssets ? `${parseFloat(formatUnits(totalAssets, 18)).toFixed(2)} MTK` : "0.00 MTK",
            change: "VERIFIED",
            icon: TrendingUp
        },
        {
            label: "Current Yield (APY)",
            val: yieldData ? `${(Number(yieldData.poolAApy) / 100).toFixed(2)}%` : "0.00%",
            change: yieldData ? `${(Number(yieldData.yieldDifference) / 100).toFixed(2)}% DIFF` : "...",
            icon: Percent
        },
        {
            label: "Vault Status",
            val: "OPTIMIZED",
            change: "REACTIVE",
            icon: Activity
        },
    ];

    const handleFaucet = () => {
        navigate("/faucet");
    };

    const handleManualRebalance = async () => {
        try {
            const hash = await writeContractAsync({
                address: ZENITH_VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: "checkYieldsAndRebalance",
            });
            setTxHash(hash);
            setIsProcessing(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAction = async () => {
        if (!amount || isProcessing) return;
        setIsProcessing(true);

        try {
            const val = parseUnits(amount, 18);

            if (activeTab === "deposit") {
                // Check Allowance
                if (!allowance || allowance < val) {
                    const approveHash = await writeContractAsync({
                        address: ASSET_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: "approve",
                        args: [ZENITH_VAULT_ADDRESS, val],
                    });
                    setTxHash(approveHash);
                    return; // Wait for approval confirmation
                }

                const hash = await writeContractAsync({
                    address: ZENITH_VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: "deposit",
                    args: [val, address],
                });
                setTxHash(hash);
            } else {
                // Redeem / Withdraw
                const hash = await writeContractAsync({
                    address: ZENITH_VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: "redeem",
                    args: [val, address, address],
                });
                setTxHash(hash);
            }
        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }
    };

    const formatHash = (hash) => {
        if (!hash) return "";
        return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
    };

    return (
        <div className="pt-32 pb-20 min-h-screen relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-2 flex items-center gap-2"
                        >
                            <ShieldCheck className="w-3 h-3" /> Verifiable On-Chain State
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
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleFaucet}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Request MTK Token</span>
                            </button>
                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Verified Sepolia Node</span>
                            </div>
                        </div>
                        <button
                            onClick={() => refetchYields()}
                            className="text-[10px] font-bold tracking-widest uppercase text-white/20 hover:text-white transition-colors"
                        >
                            Sync Explorer
                        </button>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="premium-card group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-white/10 transition-colors" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-white/10 text-white uppercase tracking-tighter">
                                    {stat.change}
                                </span>
                            </div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1 relative z-10">{stat.label}</div>
                            <div className="text-3xl font-orbit font-bold text-white tracking-tight relative z-10">{stat.val}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 premium-card flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40">Portfolio Distribution</h3>
                            <a
                                href={`https://sepolia.etherscan.io/address/${ZENITH_VAULT_ADDRESS}`}
                                target="_blank"
                                className="text-[10px] uppercase font-bold text-white/20 hover:text-white transition-colors flex items-center gap-1"
                                rel="noreferrer"
                            >
                                Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="space-y-10 flex-grow">
                            {allocations?.map((pool, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-orbit font-bold text-xs text-white/60">
                                                {i === 0 ? "A" : "B"}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-0.5 uppercase tracking-widest">
                                                    {i === 0 ? "MockAaveProtocol" : "MockCompoundProtocol"}
                                                </div>
                                                <div className="text-xs font-mono text-white/30 tracking-tighter">
                                                    {pool.poolAddress?.slice(0, 10)}...{pool.poolAddress?.slice(-4)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Target Weight</div>
                                            <div className="text-xl font-orbit font-bold text-white tracking-widest">{Number(pool.percentage) / 100}%</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Number(pool.percentage) / 100}%` }}
                                            transition={{ duration: 1.5, delay: 0.8 + (i * 0.3) }}
                                            className="h-full bg-gradient-to-r from-white/20 via-white to-white/20 rounded-full"
                                        />
                                    </div>
                                </div>
                            )) || (
                                    <div className="text-center py-20 text-white/10 uppercase tracking-[0.3em] animate-pulse">
                                        Initializing allocation matrix...
                                    </div>
                                )}
                        </div>

                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                                    <Activity className="w-6 h-6 text-white/40 animate-pulse" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest">Autonomous Rebalancing</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 max-w-sm">
                                        The Reactive Network automatically migrates liquidity to the highest-yielding protocol.
                                        {yieldData && <span className="text-white/60 ml-2">Currently targeting: {Number(yieldData.poolAApy) > Number(yieldData.poolBApy) ? "Pool A" : "Pool B"}</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleManualRebalance}
                                disabled={isProcessing}
                                className="relative h-12 px-8 rounded-xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-zenith-silver hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group flex items-center gap-2"
                            >
                                <span>Execute Rebalance</span>
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="premium-card flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="mb-8">
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-8">Personal Terminal</h3>

                            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-4">
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", activeTab === "deposit" ? "bg-white text-black font-black" : "text-white/40 hover:text-white")}
                                >
                                    Deposit
                                </button>
                                <button
                                    onClick={() => setActiveTab("withdraw")}
                                    className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", activeTab === "withdraw" ? "bg-white text-black font-black" : "text-white/40 hover:text-white")}
                                >
                                    Withdraw
                                </button>
                            </div>

                            <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Vault Shares (ZTH)
                                </div>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">
                                    When you deposit **MTK**, you receive **ZTH** shares. ZTH represents your 1:1 ownership of assets + accumulated yield in the vault. Withdraw ZTH anytime to reclaim your MTK.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Target Amount</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                                            Balance: {activeTab === "deposit" ? (mtkBalance ? parseFloat(formatUnits(mtkBalance, 18)).toFixed(2) : "0.00") : (zthBalance ? parseFloat(formatUnits(zthBalance, 18)).toFixed(2) : "0.00")} {activeTab === "deposit" ? "MTK" : "ZTH"}
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xl font-orbit font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within:text-white/40 transition-colors">
                                            {activeTab === "deposit" ? "MTK" : "ZTH"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold uppercase tracking-widest text-white/20">Protocol Fee</span>
                                        <span className="font-bold text-white/80">0.00%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold uppercase tracking-widest text-white/20">Slippage Tolerance</span>
                                        <span className="font-bold text-white/80">Auto</span>
                                    </div>
                                    <div className="h-[1px] bg-white/5" />
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold uppercase tracking-widest text-white/60 font-orbit">Estimated {activeTab === "deposit" ? "ZTH (Shares)" : "MTK (Asset)"}</span>
                                        <span className="font-bold text-white font-orbit">{amount || "0.00"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <button
                                onClick={handleAction}
                                disabled={!amount || isProcessing}
                                className="relative w-full h-14 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zenith-silver hover:scale-[1.01] transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>
                                    {isProcessing ? "Processing..." : (activeTab === "deposit" ? ((!allowance || allowance < parseUnits(amount || "0", 18)) ? "Authorize MTK" : "Deposit MTK") : "Withdraw MTK")}
                                </span>
                                <Wallet className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-center text-white/20 uppercase tracking-widest leading-relaxed">
                                Assets are managed by audited reactive contracts. <br /> Monitor state on-chain.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Real-Time Activity Ledger */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 premium-card"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-white/20" /> Activity Ledger
                            </h3>
                            <div className="text-[9px] text-white/20 uppercase tracking-widest mt-1">Real-time on-chain transaction history</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={fetchActivities}
                                disabled={isLoadingActivities}
                                className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <RefreshCw className={cn("w-3 h-3", isLoadingActivities && "animate-spin")} />
                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Refresh</span>
                            </button>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-green-500/5 border border-green-500/10">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                <span className="text-[9px] font-bold text-green-500/80 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {isLoadingActivities ? (
                            <div className="text-center py-12 text-white/20 uppercase tracking-[0.3em] animate-pulse">
                                Fetching on-chain events...
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-white/10 uppercase tracking-[0.3em] mb-4">No recent activity</div>
                                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                                    Deposit, redeem, or trigger a rebalance to see your transactions here.
                                </p>
                            </div>
                        ) : (
                            activities.map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group cursor-default">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                                            <ArrowDown className={cn("w-4 h-4", tx.type === "Withdraw" ? "" : "rotate-180", tx.type === "Rebalance" && "rotate-90")} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-white uppercase tracking-widest mb-0.5">{tx.type}</div>
                                            <div className="text-[9px] text-white/20 font-mono tracking-tighter group-hover:text-white/40 transition-colors">{formatHash(tx.hash)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right hidden md:block">
                                            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{tx.val}</div>
                                            <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold">{tx.status} • Block #{tx.blockNumber?.toString()}</div>
                                        </div>
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                            target="_blank"
                                            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
