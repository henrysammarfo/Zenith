import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Project uses Sepolia only - Lasna (Reactive) is backend automation layer
export const config = getDefaultConfig({
    appName: 'Zenith',
    projectId: '33e7ea13aff389061aaf7e51c69dff4c', // Zenith WalletConnect Project
    chains: [sepolia],
    ssr: false,
});
