import { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { Dashboard } from './components/Dashboard';
import { InventoryManager } from './components/inventory/InventoryManager';
import { POSSystem } from './components/pos/POSSystem';
import { SupplierManager } from './components/suppliers/SupplierManager';
import { PurchaseOrders } from './components/orders/PurchaseOrders';
import { ReportsPage } from './components/reports/ReportsPage';
import { UserManagement } from './components/settings/UserManagement';
import { Sidebar } from './components/layout/Sidebar';
import { GeminiChat } from './components/chat/GeminiChat';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (showSignup) {
      return <SignupPage onBack={() => setShowSignup(false)} />;
    }
    return <LoginPage onSignupClick={() => setShowSignup(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard session={session} />;
      case 'inventory':
        return <InventoryManager session={session} />;
      case 'pos':
        return <POSSystem session={session} />;
      case 'suppliers':
        return <SupplierManager session={session} />;
      case 'orders':
        return <PurchaseOrders session={session} />;
      case 'reports':
        return <ReportsPage session={session} />;
      case 'users':
        return <UserManagement session={session} />;
      default:
        return <Dashboard session={session} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onSignOut={handleSignOut}
        user={session.user}
      />
      <div className="flex-1 ml-64">
        <div className="p-8">
          {renderPage()}
        </div>
      </div>
      <GeminiChat session={session} />
    </div>
  );
}
