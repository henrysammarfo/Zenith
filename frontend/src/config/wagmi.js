import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Custom Lasna Chain
export const lasna = {
    id: 20240813,
    name: 'Lasna',
    iconUrl: 'https://raw.githubusercontent.com/henrysammarfo/Zenith/main/logo.png',
    iconBackground: '#fff',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://lasna-rpc.rnk.dev'] },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://lasna-explorer.rnk.dev' },
    },
};

export const config = getDefaultConfig({
    appName: 'Zenith',
    projectId: '3f044738550186586036815372338029', // Reown Public Demo ID
    chains: [sepolia, lasna],
    ssr: false,
});
