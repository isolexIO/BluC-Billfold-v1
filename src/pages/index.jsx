import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Send from "./Send";

import Receive from "./Receive";

import History from "./History";

import Settings from "./Settings";

import ImportWallet from "./ImportWallet";

import Staking from "./Staking";

import MultiChain from "./MultiChain";

import Admin from "./Admin";

import Swap from "./Swap";

import Mining from "./Mining";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Send: Send,
    
    Receive: Receive,
    
    History: History,
    
    Settings: Settings,
    
    ImportWallet: ImportWallet,
    
    Staking: Staking,
    
    MultiChain: MultiChain,
    
    Admin: Admin,
    
    Swap: Swap,
    
    Mining: Mining,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Send" element={<Send />} />
                
                <Route path="/Receive" element={<Receive />} />
                
                <Route path="/History" element={<History />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/ImportWallet" element={<ImportWallet />} />
                
                <Route path="/Staking" element={<Staking />} />
                
                <Route path="/MultiChain" element={<MultiChain />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Swap" element={<Swap />} />
                
                <Route path="/Mining" element={<Mining />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}