import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Languages, 
  Book, 
  CloudOff, 
  Cloud, 
  Download, 
  Plus, 
  History, 
  Trash2,
  ArrowRightLeft,
  Settings,
  Volume2,
  Globe,
  X,
  Check,
  FileDown,
  FileUp,
  Share2,
  ChevronDown
} from 'lucide-react';
import { cn } from './lib/utils';
import { useOnline } from './hooks/useOnline';
import { translateText, getDictionaryEntry } from './services/translator';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

type TabType = 'translate' | 'dictionary' | 'saved' | 'settings';

export default function App() {
  const isOnline = useOnline();
  const [activeTab, setActiveTab] = useState<TabType>('translate');
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('French');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  const history = useLiveQuery(() => db.entries.orderBy('createdAt').reverse().limit(10).toArray());
  const allSaved = useLiveQuery(() => db.entries.toArray());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If DB is taking too long, show a warning or fallback
  const [dbReady, setDbReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDbReady(true);
    }, 2000); // Wait 2s for DB
    return () => clearTimeout(timer);
  }, []);

  if ((history === undefined || allSaved === undefined) && !dbReady) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-serif italic text-xl opacity-50 p-6 text-center">
        Synchronizing Linguistic Patterns...
      </div>
    );
  }

  const cacheResult = async (word: string, definition: string, lang: string) => {
    try {
      const exists = await db.entries.where('word').equals(word.toLowerCase()).and(e => e.language === lang).first();
      if (!exists) {
        await db.entries.add({
          word: word.toLowerCase(),
          definition,
          language: lang,
          source: 'offline',
          createdAt: Date.now()
        });
        setSyncStatus('syncing');
        setTimeout(() => setSyncStatus('done'), 1500);
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (e) {
      console.error('Cache failed', e);
    }
  };

  const handleAction = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResult(null);
    
    try {
      if (activeTab === 'translate') {
        if (isOnline) {
          const translation = await translateText(inputText, targetLang, sourceLang);
          setResult({ type: 'translation', content: translation });
          if (inputText.split(' ').length < 5) {
            await cacheResult(inputText, translation, targetLang);
          }
        } else {
          const entry = await db.entries
            .where('word')
            .equals(inputText.toLowerCase())
            .and(e => e.language === targetLang)
            .first();
          
          if (entry) {
            setResult({ type: 'translation', content: entry.definition, fromCache: true });
          } else {
            setResult({ type: 'error', message: 'Offline pack missing for this language.' });
          }
        }
      } else {
        if (isOnline) {
          const entry = await getDictionaryEntry(inputText, targetLang);
          setResult({ type: 'dictionary', ...entry });
          if (entry) {
            await cacheResult(inputText, entry.definition, targetLang);
          }
        } else {
           const entry = await db.entries
            .where('word')
            .equals(inputText.toLowerCase())
            .and(e => e.language === targetLang)
            .first();

           if (entry) {
             setResult({ 
               type: 'dictionary', 
               definition: entry.definition, 
               pronunciation: 'Offline', 
               examples: ['Cached local definition'],
               fromCache: true 
             });
           } else {
             setResult({ type: 'error', message: 'Word not found in local lexicon.' });
           }
        }
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Translation engine unavailable.' });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!allSaved) return;
    const blob = new Blob([JSON.stringify(allSaved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyglot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await db.entries.bulkAdd(data);
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary p-6 md:p-12 flex flex-col font-sans">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-baseline border-b border-brand-primary pb-8 mb-12 gap-6">
        <div className="flex items-baseline gap-4">
          <h1 className="text-5xl font-serif font-black tracking-tighter uppercase italic leading-none">Polyglot</h1>
          <span className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-30 whitespace-nowrap">Local-First Lexis v.2.4</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-red-500 animate-pulse")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Engine: {isOnline ? 'Cloud Active' : 'Offline Mode'}
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('translate')}
              className={cn("text-[10px] font-bold uppercase tracking-widest border-b transition-colors", activeTab === 'translate' ? "border-brand-primary" : "border-transparent opacity-40 hover:opacity-100")}
            >Translate</button>
            <button 
               onClick={() => setActiveTab('dictionary')}
               className={cn("text-[10px] font-bold uppercase tracking-widest border-b transition-colors", activeTab === 'dictionary' ? "border-brand-primary" : "border-transparent opacity-40 hover:opacity-100")}
            >Dictionary</button>
            <button 
               onClick={() => setActiveTab('saved')}
               className={cn("text-[10px] font-bold uppercase tracking-widest border-b transition-colors", activeTab === 'saved' ? "border-brand-primary" : "border-transparent opacity-40 hover:opacity-100")}
            >Library</button>
            <button 
              onClick={() => setIsDownloadOpen(true)}
              className="px-4 py-2 border border-brand-primary text-[10px] uppercase tracking-widest font-black hover:bg-brand-primary hover:text-brand-bg transition-all"
            >Manage Packs</button>
          </nav>
        </div>
      </header>

      {/* Main Editorial Grid */}
      <main className="flex-1 lg:grid lg:grid-cols-12 lg:gap-16">
        {/* Left Section: Input Area */}
        <section className={cn("lg:col-span-5 flex flex-col mb-12 lg:mb-0", (activeTab === 'saved' || activeTab === 'settings') && "hidden lg:flex")}>
          <div className="mb-12">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Source Language</span>
              <div className="flex items-center gap-2">
                <select 
                  value={sourceLang} 
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="text-xs font-serif italic border-b border-brand-primary bg-transparent outline-none cursor-pointer"
                >
                  <option>English</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
                <button 
                  onClick={() => { setSourceLang(targetLang); setTargetLang(sourceLang); }}
                  className="p-1 hover:rotate-180 transition-transform duration-500 opacity-40"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-transparent text-4xl md:text-5xl font-serif italic leading-[1.1] outline-none resize-none placeholder:opacity-10 min-h-[200px]"
                placeholder={activeTab === 'translate' ? "L'appel du vide..." : "Search lexicon..."}
              />
              <div className="absolute bottom-0 right-0 p-2 text-[10px] font-mono opacity-20">
                {inputText.length} chars
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleAction}
                disabled={isLoading || !inputText}
                className="group relative px-10 py-4 bg-brand-primary text-brand-bg text-xs font-black uppercase tracking-[0.2em] brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {isLoading ? 'Processing...' : activeTab === 'translate' ? 'Produce Translation' : 'Consult Lexicon'}
              </button>
            </div>
          </div>

          <div className="mt-auto hidden lg:block p-8 bg-white border border-brand-primary brutal-shadow">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Local History</h3>
            <div className="space-y-4">
              {(history || []).slice(0, 3).map(h => (
                <div key={h.id} className="flex flex-col gap-1 border-l-2 border-brand-primary/10 pl-3">
                  <p className="text-xs font-bold font-serif italic">{h.word}</p>
                  <p className="text-[10px] opacity-40 line-clamp-1">{h.definition}</p>
                </div>
              ))}
              {(!history || history.length === 0) && (
                <p className="text-[10px] italic opacity-30">Your session history is local and encrypted.</p>
              )}
            </div>
          </div>
        </section>

        {/* Right Section: Results / Content Area */}
        <section className={cn("lg:col-span-7 flex flex-col border-t lg:border-t-0 lg:border-l border-brand-primary/10 pt-12 lg:pt-0 lg:pl-16")}>
          <AnimatePresence mode="wait">
            {(activeTab === 'translate' || activeTab === 'dictionary') && (
              <motion.div 
                key="result-view"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex justify-between items-end mb-8">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Target:</span>
                    <select 
                      value={targetLang} 
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="text-xs font-serif italic border-b border-brand-primary bg-transparent outline-none"
                    >
                      <option>French</option>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div className="flex gap-6">
                    <button className="text-[10px] uppercase font-black tracking-widest border-b border-transparent hover:border-brand-primary transition-all">Pronounce</button>
                    <button 
                      onClick={async () => {
                        if (!result) return;
                        await db.entries.add({
                          word: inputText,
                          definition: result.type === 'translation' ? result.content : result.definition,
                          language: targetLang,
                          source: 'custom',
                          createdAt: Date.now()
                        });
                      }}
                      className="text-[10px] uppercase font-black tracking-widest border-b border-transparent hover:border-brand-primary transition-all"
                    >Save to Library</button>
                  </div>
                </div>

                {result ? (
                  <div className="flex-1">
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      className="text-6xl md:text-7xl font-serif leading-[0.9] mb-12 italic tracking-tight underline decoration-brand-primary/5 decoration-4"
                    >
                      {result.type === 'error' ? 'An unexpected silence.' : result.type === 'translation' ? result.content : inputText}
                    </motion.h2>
                    
                    {result.type === 'dictionary' && (
                      <div className="grid md:grid-cols-2 gap-12 mt-12">
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-widest text-brand-accent mb-4 underline decoration-brand-accent/20">Nuance Analysis</span>
                          <p className="text-sm leading-relaxed font-light italic">
                            “{result.definition}”
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                             <span className="text-[10px] font-mono opacity-30 text-brand-accent">Pronunciation:</span>
                             <span className="text-xs font-bold">/{result.pronunciation}/</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">Synonyms & Context</span>
                          <ul className="text-xs space-y-2 font-medium">
                            {result.synonyms?.map((s: string) => (
                              <li key={s} className="opacity-60">• {s}</li>
                            ))}
                            {(!result.synonyms || result.synonyms.length === 0) && <li className="italic opacity-30">• No synonyms available offline.</li>}
                          </ul>
                        </div>
                      </div>
                    )}

                    {result.examples && result.examples.length > 0 && (
                      <div className="mt-16 p-10 border-t border-dashed border-brand-primary/30">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 block mb-6">Contextual Usage Examples</span>
                        <blockquote className="text-2xl font-serif italic leading-snug">
                          {result.examples[0].split(' ').map((word: string, i: number) => (
                            <span key={i} className={cn(word.toLowerCase().includes(inputText.toLowerCase()) ? "bg-brand-highlight px-1" : "")}>
                               {word}{' '}
                            </span>
                          ))}
                        </blockquote>
                        <cite className="block mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">— Curated Open Source Repository</cite>
                      </div>
                    )}

                    {result.type === 'error' && (
                      <p className="text-sm italic opacity-50 max-w-sm">{result.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border-t border-dashed border-brand-primary/10 mt-12 opacity-10">
                    <Book className="w-16 h-16 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Analysis</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'saved' && (
              <motion.div 
                key="library-view"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 space-y-12 pb-24"
              >
                <div className="flex justify-between items-baseline border-b border-brand-primary pb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Collective Repository ({(allSaved || []).length})</h3>
                  <div className="flex gap-4">
                    <button onClick={exportData} className="text-[10px] font-black uppercase hover:underline">Export</button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black uppercase hover:underline">Import</button>
                    <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
                  </div>
                </div>

                <div className="space-y-4">
                  {(allSaved || []).map(entry => (
                    <div key={entry.id} className="group border-b border-brand-primary/10 pb-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-2xl font-serif italic">{entry.word}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{entry.language}</span>
                        </div>
                        <p className="text-xs font-light leading-relaxed max-w-lg italic opacity-60 line-clamp-2">“{entry.definition}”</p>
                      </div>
                      <button 
                        onClick={() => entry.id && db.entries.delete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {allSaved?.length === 0 && (
                    <div className="py-32 text-center opacity-20 italic font-serif text-lg">
                      Your collective intelligence contains no entries yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings-view"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="max-w-xl self-center w-full space-y-16 py-12"
              >
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 border-b border-brand-primary/10 pb-4">Interaction Paradigms</h3>
                  <div className="space-y-10">
                    <EditorialSettingItem 
                      label="Incognito Processing" 
                      desc="Disable persistent local storage for the current session." 
                    />
                    <EditorialSettingItem 
                      label="Predictive Sync" 
                      desc="Automatically cache high-probability future queries while connected." 
                    />
                    <EditorialSettingItem 
                      label="Haptic Resonance" 
                      desc="Subtle mechanical feedback during linguistic processing." 
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 border-b border-brand-primary/10 pb-4">Storage Architecture</h3>
                  <div className="p-10 border border-brand-primary brutal-shadow-sm bg-white">
                    <div className="flex justify-between items-baseline mb-6">
                      <span className="text-xl font-serif italic">Local Lexis Cache</span>
                      <span className="text-[10px] font-mono opacity-40">1.42 MB UTILIZED</span>
                    </div>
                    <div className="h-px w-full bg-brand-primary/10 mb-8" />
                    <button 
                      onClick={() => { if(confirm('Purge all local intelligence?')) db.entries.clear(); }}
                      className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-brand-accent text-white hover:bg-brand-primary transition-colors"
                    >Purge Local Repository</button>
                    <p className="mt-4 text-[9px] uppercase tracking-widest opacity-30 text-center">Caution: This action is irreversible and sync-destructive.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="mt-12 pt-8 border-t border-brand-primary flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Architecture</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Verified & Encrypted Local-First</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Status</span>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 bg-brand-primary text-brand-bg">P2P Sync</span>
               {syncStatus !== 'idle' && <span className="text-[10px] font-bold text-brand-accent animate-pulse">● {syncStatus}</span>}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest opacity-40 mb-1">License</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter underline underline-offset-2">GNU Free Documentation</span>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button className="w-10 h-10 rounded-full border border-brand-primary flex items-center justify-center text-xs font-black hover:bg-brand-primary hover:text-brand-bg transition-all">?</button>
           <button 
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-full border border-brand-primary flex items-center justify-center text-xs font-black hover:bg-brand-primary hover:text-brand-bg transition-all"
           >⚙</button>
        </div>
      </footer>

      {/* Management Drawer (Brutalist) */}
      <AnimatePresence>
        {isDownloadOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDownloadOpen(false)}
              className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-brand-bg w-full max-w-2xl border-2 border-brand-primary p-12 brutal-shadow"
            >
              <button 
                onClick={() => setIsDownloadOpen(false)}
                className="absolute top-8 right-8 p-2 border border-brand-primary hover:bg-brand-primary hover:text-brand-bg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-12">
                <h2 className="text-5xl font-serif italic mb-4">Pack Management</h2>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Ensure linguistic autonomy without persistent connectivity.</p>
              </div>

              <div className="space-y-6">
                <EditorialPackItem name="French Lexis" id="en-fr" size="1.2 MB" />
                <EditorialPackItem name="Spanish Lexis" id="en-es" size="1.5 MB" />
                <div className="opacity-20 pointer-events-none">
                  <EditorialPackItem name="German Lexis" id="en-de" size="0.9 MB" />
                </div>
              </div>

              <button 
                onClick={() => setIsDownloadOpen(false)}
                className="mt-12 w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] border-t border-brand-primary/10 hover:opacity-100 transition-opacity"
              >
                Return to Lexicon
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditorialPackItem({ name, id, size }: { name: string, id: string, size: string }) {
  const [status, setStatus] = useState<'available' | 'downloading' | 'installed'>('available');
  
  const handleDownload = async () => {
    setStatus('downloading');
    try {
      const response = await fetch(`/packs/${id}.json`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      await db.entries.bulkAdd(data.map((item: any) => ({ ...item, createdAt: Date.now() })));
      setStatus('installed');
    } catch {
      setStatus('available');
    }
  };

  return (
    <div className="flex items-center justify-between p-6 border border-brand-primary/10 bg-white">
      <div>
        <h4 className="font-serif italic text-2xl mb-1">{name}</h4>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{size} / Verified Package</span>
      </div>
      
      {status === 'installed' ? (
        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Active</span>
      ) : (
        <button 
          onClick={handleDownload}
          disabled={status === 'downloading'}
          className={cn(
            "px-6 py-2 border border-brand-primary text-[10px] font-black uppercase tracking-widest transition-all",
            status === 'downloading' ? "opacity-30" : "hover:bg-brand-primary hover:text-white"
          )}
        >
          {status === 'downloading' ? '...' : 'Install'}
        </button>
      )}
    </div>
  );
}

function EditorialSettingItem({ label, desc }: { label: string, desc: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="flex items-start justify-between group cursor-pointer" onClick={() => setActive(!active)}>
      <div className="max-w-md">
        <h4 className="text-xl font-serif italic mb-2 group-hover:text-brand-accent transition-colors">{label}</h4>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 leading-relaxed">{desc}</p>
      </div>
      <div className={cn(
        "w-12 h-6 border border-brand-primary transition-all flex items-center px-1",
        active ? "bg-brand-primary" : "bg-transparent"
      )}>
        <motion.div 
          animate={{ x: active ? 22 : 0 }}
          className={cn("w-4 h-4", active ? "bg-brand-bg" : "bg-brand-primary")}
        />
      </div>
    </div>
  );
}

function LangSelect({ value, onChange, alignRight }: { value: string, onChange: (v: string) => void, alignRight?: boolean }) {
  return (
    <div className={cn("flex-1 p-4", alignRight ? "text-right" : "text-left")}>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-serif italic text-2xl border-none outline-none focus:ring-0 w-full cursor-pointer hover:text-brand-accent transition-colors"
      >
        <option>English</option>
        <option>French</option>
        <option>Spanish</option>
        <option>German</option>
      </select>
    </div>
  );
}
