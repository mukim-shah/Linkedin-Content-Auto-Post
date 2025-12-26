
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PostFormData } from './types';
import { DEFAULT_WEBHOOK_URL, PLATFORMS, TONES } from './constants';

const App: React.FC = () => {
  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('CUSTOM_WEBHOOK_URL') || DEFAULT_WEBHOOK_URL;
  });

  const [formData, setFormData] = useState<PostFormData>({
    platform: 'Instagram',
    content: '',
    tone: 'Professional',
    postDate: '',
    postTime: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Secret Config Access State
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('CUSTOM_WEBHOOK_URL', webhookUrl.trim());
  }, [webhookUrl]);

  // Validation Logic
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const validationStatus = useMemo(() => {
    if (!formData.postDate || !formData.postTime) return { valid: false, message: 'Ready to schedule' };
    
    const now = new Date();
    const selected = new Date(`${formData.postDate}T${formData.postTime}`);
    
    if (selected <= now) {
      return { valid: false, message: 'Select future time' };
    }
    return { valid: true, message: 'Schedule verified' };
  }, [formData.postDate, formData.postTime]);

  const handleTitleClick = () => {
    setClickCount(prev => prev + 1);
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => setClickCount(0), 800);

    if (clickCount + 1 >= 4) {
      setIsSettingsOpen(true);
      setClickCount(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationStatus.valid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use the sanitized URL
      const targetUrl = webhookUrl.trim();
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          scheduled_at: `${formData.postDate} ${formData.postTime}`,
          system_timestamp: new Date().toISOString()
        }),
      }).catch(err => {
        // Handle network-level errors (CORS, DNS, connection refused)
        if (err.name === 'TypeError') {
          throw new Error('Connection failed. Please verify the Webhook URL and CORS settings.');
        }
        throw err;
      });

      if (!response.ok) {
        // Handle server-level errors (404, 500, etc.)
        const statusText = response.status === 404 ? 'Endpoint not found (404)' : `Server error (${response.status})`;
        throw new Error(`Sync failed: ${statusText}. Check your n8n workflow.`);
      }

      setIsSuccess(true);
      setFormData(prev => ({ ...prev, content: '', postDate: '', postTime: '' }));
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during sync.');
    } finally {
      setIsLoading(false);
    }
  };

  // Wheat Theme Input Styles
  const inputBaseClass = "w-full bg-[#f1efe6]/60 border border-[#e5e1d3] text-slate-800 text-sm font-semibold rounded-2xl p-4 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all duration-300 placeholder:text-slate-400 shadow-sm";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-10 relative overflow-hidden bg-[#05070a]">
      
      {/* Background Animated Orbs */}
      <div className="orb w-[700px] h-[700px] bg-indigo-600/10 top-[-20%] left-[-10%] animate-[float-slow_25s_infinite_alternate]" />
      <div className="orb w-[600px] h-[600px] bg-fuchsia-600/5 bottom-[-15%] right-[-5%] animate-[float-slow_30s_infinite_alternate_reverse]" />

      {/* Admin Panel Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#fdfbf7] border border-[#e5e1d3] rounded-[3.5rem] p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-slate-900 font-black text-2xl tracking-tighter">System Context</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Webhook Secret Key</p>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="space-y-8">
              <input 
                type="text" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[11px] font-mono text-indigo-500 outline-none focus:ring-8 focus:ring-indigo-50"
                placeholder="https://..."
              />
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all uppercase tracking-tighter shadow-2xl"
              >
                UPDATE PIPELINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Branding */}
      <header className="text-center mb-16 z-10 relative">
        <div 
          onClick={handleTitleClick}
          className="inline-flex items-center justify-center w-28 h-28 bg-slate-900/40 border border-white/5 rounded-[3rem] mb-12 shadow-3xl animate-float cursor-default group overflow-hidden relative backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/15 transition-colors" />
          <svg className="w-14 h-14 text-indigo-400 group-hover:scale-110 transition-transform duration-700 relative z-10 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h1 
          onClick={handleTitleClick}
          className="text-6xl sm:text-7xl font-black text-white tracking-tighter cursor-pointer select-none active:scale-[0.98] transition-all"
        >
          AutoPost <span className="bg-gradient-to-tr from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">Pro</span>
        </h1>
        <p className="text-slate-400 mt-6 font-medium text-xl max-w-lg mx-auto opacity-60 tracking-tight italic">Orchestrate your social universe.</p>
      </header>

      {/* Main Content Card with PREMIUM MAGIC BORDER */}
      <div className="w-full max-w-2xl z-10 px-2">
        <div className="magic-border-container shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]">
          <div className="glass-card-inner p-10 sm:p-16 relative">
            
            <div className="relative">
              {isSuccess ? (
                <div className="py-24 text-center animate-in zoom-in-95 duration-1000">
                  <div className="w-32 h-32 bg-indigo-50/50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-12 border-2 border-indigo-100 shadow-xl">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h2 className="text-6xl font-black text-slate-900 mb-5 tracking-tighter">Success</h2>
                  <p className="text-slate-500 mb-14 text-lg font-medium max-w-xs mx-auto">Your payload has been successfully dispatched to the distribution queue.</p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="px-20 py-6 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-slate-900 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                  >
                    DISPATCH NEW SIGNAL
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {error && (
                    <div className="p-6 bg-rose-50 border-2 border-rose-100 text-rose-500 text-sm font-black rounded-[2.5rem] flex items-center gap-5 animate-in slide-in-from-top-4 shadow-lg shadow-rose-100/50">
                      <svg className="w-7 h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <div className="flex flex-col">
                        <span className="uppercase text-[10px] tracking-widest opacity-60 mb-1">Error Identified</span>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Platform Selection */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Channel</label>
                      <div className="relative">
                        <select
                          name="platform"
                          value={formData.platform}
                          onChange={handleInputChange}
                          className={inputBaseClass + " appearance-none pr-12"}
                        >
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Tone Selection */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Tone</label>
                      <div className="relative">
                        <select
                          name="tone"
                          value={formData.tone}
                          onChange={handleInputChange}
                          className={inputBaseClass + " appearance-none pr-12"}
                        >
                          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Payload Draft</label>
                      <span className="text-[10px] text-slate-300 font-black tracking-[0.2em]">{formData.content.length} / 2200</span>
                    </div>
                    <textarea
                      name="content"
                      rows={6}
                      value={formData.content}
                      onChange={handleInputChange}
                      className={inputBaseClass + " resize-none p-8 leading-relaxed"}
                      placeholder="Capture your vision..."
                      required
                    ></textarea>
                  </div>

                  {/* Timing Matrix */}
                  <div className={`p-10 rounded-[3rem] border-2 transition-all duration-1000 ${validationStatus.valid ? 'bg-[#f1efe6]/60 border-[#e5e1d3]' : 'bg-rose-50/40 border-rose-100'}`}>
                    <div className="flex justify-between items-center mb-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${validationStatus.valid ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'bg-rose-400 animate-pulse'}`}></div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Dispatch Timing</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-2xl ${validationStatus.valid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {validationStatus.message}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-[0.2em]">Release Date</span>
                        <input
                          type="date"
                          name="postDate"
                          min={todayStr}
                          value={formData.postDate}
                          onChange={handleInputChange}
                          className={inputBaseClass + ` py-4 ${!validationStatus.valid && formData.postDate ? 'border-rose-200 bg-rose-50/30' : ''}`}
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-[0.2em]">Release Time</span>
                        <input
                          type="time"
                          name="postTime"
                          value={formData.postTime}
                          onChange={handleInputChange}
                          className={inputBaseClass + ` py-4 ${!validationStatus.valid && formData.postTime ? 'border-rose-200 bg-rose-50/30' : ''}`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Control */}
                  <button
                    type="submit"
                    disabled={isLoading || !validationStatus.valid}
                    className={`group w-full relative h-24 rounded-[2.5rem] transition-all duration-700 transform hover:-translate-y-2 active:scale-[0.98] flex items-center justify-center gap-6 overflow-hidden shadow-2xl ${
                      isLoading || !validationStatus.valid
                        ? 'bg-[#e5e1d3] cursor-not-allowed text-[#a8a493]' 
                        : 'bg-indigo-600 text-white shadow-indigo-200/50 hover:bg-slate-900'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="font-bold uppercase tracking-[0.3em] text-white/70 text-xs">Syncing Pipeline...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-black text-2xl tracking-tighter uppercase italic">Authorize Dispatch</span>
                        <svg className="w-8 h-8 transition-transform group-hover:translate-x-3 duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                    {/* Visual Polish */}
                    {!isLoading && validationStatus.valid && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shine_2s_infinite] pointer-events-none"></div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Branding */}
      <footer className="mt-24 text-slate-800 text-[11px] font-black uppercase tracking-[1.2em] flex items-center gap-12 z-10 opacity-20 select-none">
        <span>Verified System</span>
        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
        <span>Optimized Flow</span>
      </footer>

      <style>{`
        .shadow-3xl { box-shadow: 0 40px 80px -25px rgba(0, 0, 0, 0.8); }
        .orb { pointer-events: none; }
      `}</style>
    </div>
  );
};

export default App;
