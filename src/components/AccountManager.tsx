
import React, { useState } from 'react';
import { SubscriptionTier, Screen } from '../types';
import { User, Mail, Lock, CreditCard, Shield, FileText, LogOut, Trash2, CheckCircle2, AlertTriangle, ExternalLink, MessageCircle, X } from 'lucide-react';

interface AccountManagerProps {
  user: { name: string; email: string; avatarUrl?: string };
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ 
  user, 
  subscriptionTier, 
  onUpgrade, 
  onLogout, 
  onNavigate 
}) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const isPro = subscriptionTier === 'ProMonthly' || subscriptionTier === 'ProAnnual';

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords do not match.");
      return;
    }
    alert("Password updated successfully.");
    setPasswordForm({ current: '', new: '', confirm: '' });
    setShowPasswordChange(false);
  };

  const handleDeleteAccount = () => {
    const confirmation = prompt("To permanently delete your account, type 'DELETE' below. This action cannot be undone.");
    if (confirmation === 'DELETE') {
      alert("Account deleted.");
      onLogout();
    }
  };

  const contactSupport = () => {
    window.location.href = `mailto:support@seamstrike.app?subject=Support Request from ${user.email}`;
  };

  const LegalModal = ({ title, onClose }: { title: string, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-grow p-8 overflow-y-auto prose prose-slate">
          <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
          <p>
            This is a placeholder for the legal document. In a production environment, this would contain the full legal text for the {title}.
          </p>
          <h4>1. Acceptance of Terms</h4>
          <p>By accessing and using SeamStrike, you accept and agree to be bound by the terms and provision of this agreement.</p>
          <h4>2. User Accounts</h4>
          <p>You are responsible for maintaining the security of your account and password. SeamStrike cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
          <h4>3. Data Privacy</h4>
          <p>Your data privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.</p>
          {/* Add more mock content to demonstrate scrolling */}
          <div className="h-64"></div>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {showLegalModal && (
        <LegalModal 
          title={showLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'} 
          onClose={() => setShowLegalModal(null)} 
        />
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account & Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile, security, and subscription.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile & Security */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold border-2 border-white dark:border-slate-700 shadow-sm">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 flex items-center text-sm">
                  <Mail className="w-3 h-3 mr-1.5" /> {user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Display Name</label>
                <input className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" defaultValue={user.name} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                <input className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-500 cursor-not-allowed" defaultValue={user.email} disabled />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-slate-400" />
                Security
              </h3>
              <button 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-sm text-indigo-600 font-bold hover:underline"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChange ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Current Password</label>
                  <input type="password" required className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">New Password</label>
                  <input type="password" required className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm New Password</label>
                  <input type="password" required className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
                </div>
                <div className="pt-2">
                  <button type="submit" className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600">Update Password</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center text-slate-600 dark:text-slate-300">
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Password last changed 3 months ago</span>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/70 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <div className="flex space-x-4">
               <button onClick={onLogout} className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
               </button>
               <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Account
               </button>
            </div>
          </div>

        </div>

        {/* Right Column: Subscription & Support */}
        <div className="space-y-6">
          
          {/* Subscription Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
              Subscription
            </h3>
            
            <div className={`p-4 rounded-lg mb-4 ${isPro ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'}`}>
              <p className="text-xs font-bold uppercase opacity-80 mb-1">Current Plan</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold tracking-tight">
                  {subscriptionTier === 'Free' ? 'Free Starter' : subscriptionTier === 'SeasonPass' ? 'Season Pass' : 'Pro Plan'}
                </span>
                {isPro && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              </div>
            </div>

            {!isPro && (
              <button 
                onClick={() => onNavigate('subscription')}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all mb-4"
              >
                Upgrade to Pro
              </button>
            )}

            {isPro && (
               <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                 Next billing date: <strong>October 15, 2024</strong>
               </div>
            )}

            <button className="text-sm text-indigo-600 font-bold hover:underline flex items-center">
              Manage Billing & Invoices <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* Support & Legal */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Support & Legal</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate('faq')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center"><FileText className="w-4 h-4 mr-3 text-slate-400" /> Help Center / FAQ</span>
              </button>
              <button onClick={contactSupport} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center"><MessageCircle className="w-4 h-4 mr-3 text-slate-400" /> Contact Support</span>
              </button>
              <button onClick={() => setShowLegalModal('terms')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center"><Shield className="w-4 h-4 mr-3 text-slate-400" /> Terms of Service</span>
              </button>
              <button onClick={() => setShowLegalModal('privacy')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center"><Lock className="w-4 h-4 mr-3 text-slate-400" /> Privacy Policy</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountManager;
