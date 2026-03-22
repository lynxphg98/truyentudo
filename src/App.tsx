import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, ChevronLeft, Download, Key, Languages, Moon, Plus, Settings, Sparkles, Sun, Trash2, Upload, User, Users, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/util/cn';
import StorageManager from '@/util/storage';
import { handleApiError } from '@/util/errorHandler';
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Alert } from '@/components/ui/Alert';
import ApiDashboardModal from '@/components/modals/ApiDashboardModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import type { ApiKeyConfig, Story } from '@/types';

type View = 'stories' | 'characters' | 'tools';
type EditAction = 'fix' | 'summary' | 'title';
const MAX = 22000;

const callAiApi = async (prompt: string, keyCfg: ApiKeyConfig, onUsage?: (id: string) => void) => {
  if (!keyCfg.key?.trim()) throw new Error('Chua co API key.');
  const provider = keyCfg.provider || 'gemini';
  let r: Response;
  if (provider === 'gemini') {
    const model = keyCfg.modelName || 'gemini-2.0-flash';
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyCfg.key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
  } else {
    const model = keyCfg.modelName || 'gpt-4o-mini';
    const base = keyCfg.baseUrl || 'https://api.openai.com/v1';
    r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keyCfg.key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.75 }),
    });
  }
  const data = await r.json();
  if (!r.ok || data?.error) throw new Error(data?.error?.message || 'Loi API.');
  if (onUsage) onUsage(keyCfg.id);
  const out = provider === 'gemini'
    ? data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('\n')
    : data?.choices?.[0]?.message?.content;
  if (!out?.trim()) throw new Error('AI khong tra noi dung.');
  return out.trim();
};

const readTxt = async (f: File) => (await f.text()).replace(/\u0000/g, '').trim();

function AppContent() {
  const { user, theme, toggleTheme } = useAuth();
  const { call, loading } = useApiCall<string>();
  const styleRef = useRef<HTMLInputElement | null>(null);
  const transRef = useRef<HTMLInputElement | null>(null);
  const draftRef = useRef<HTMLInputElement | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [showApi, setShowApi] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<View>('stories');
  const [stories, setStories] = useState<Story[]>([]);
  const [selected, setSelected] = useState<Story | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(''); const [content, setContent] = useState('');
  const [styleCorpus, setStyleCorpus] = useState('');
  const [translateSource, setTranslateSource] = useState(''); const [translateTarget, setTranslateTarget] = useState('Tieng Viet'); const [translateResult, setTranslateResult] = useState('');
  const [draftName, setDraftName] = useState(''); const [draftText, setDraftText] = useState(''); const [moreNote, setMoreNote] = useState(''); const [chapters, setChapters] = useState(3); const [words, setWords] = useState(1200); const [draftResult, setDraftResult] = useState('');
  const [assistIn, setAssistIn] = useState(''); const [assistOut, setAssistOut] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const k = StorageManager.getItem<ApiKeyConfig[]>('api_keys') || [];
    const s = StorageManager.getItem<Story[]>('stories') || [];
    setApiKeys(k); setStories(s); setStyleCorpus(StorageManager.getItem<string>('style_corpus') || '');
  }, []);
  const activeKey = apiKeys.find((k) => k.isActive) || apiKeys[0];
  const saveStories = (x: Story[]) => { setStories(x); StorageManager.setItem('stories', x); };
  const updateUsage = (id: string) => { const x = apiKeys.map((k) => (k.id === id ? { ...k, usageCount: k.usageCount + 1 } : k)); setApiKeys(x); StorageManager.setItem('api_keys', x); };
  const withStyle = (p: string) => (styleCorpus.trim() ? `${p}\n\n[Mau van phong]\n${styleCorpus.slice(-MAX)}` : p);

  const runAI = async (prompt: string, onDone: (v: string) => void) => {
    if (!activeKey) { setShowApi(true); setAlert({ type: 'warning', message: 'Can cai API key de dung AI.' }); return; }
    try { const r = await call(() => callAiApi(withStyle(prompt), activeKey, updateUsage)); if (r) onDone(r); }
    catch (e: unknown) { setAlert({ type: 'error', message: handleApiError(e).message }); }
  };

  const saveCurrentStory = () => {
    if (!title.trim()) return setAlert({ type: 'warning', message: 'Vui long nhap tieu de.' });
    const next = selected ? stories.map((s) => (s.id === selected.id ? { ...s, title, content, updatedAt: new Date().toISOString() } : s))
      : [{ id: `story-${Date.now()}`, title, content, type: 'original', updatedAt: new Date().toISOString() }, ...stories];
    saveStories(next); setEditing(false); setSelected(null); setTitle(''); setContent(''); setAlert({ type: 'success', message: 'Da luu tac pham.' });
  };

  const continueSelected = (s: Story) => runAI(`Viet tiep truyen sau khoang 900-1300 chu, mach lac va khong lap y:\n${s.content.slice(-2500)}`, (r) => {
    const next = stories.map((x) => (x.id === s.id ? { ...x, content: `${x.content}\n\n${r}`, type: 'continued', updatedAt: new Date().toISOString() } : x));
    saveStories(next); setSelected(next.find((x) => x.id === s.id) || null);
  });

  const loadStyleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = e.target.files; if (!fs?.length) return;
    const out: string[] = []; for (const f of Array.from(fs)) out.push(`[${f.name}]\n${(await readTxt(f)).slice(0, MAX)}`);
    const m = `${styleCorpus}\n\n${out.join('\n\n')}`.slice(-MAX); setStyleCorpus(m); StorageManager.setItem('style_corpus', m); setAlert({ type: 'success', message: `Da nap ${out.length} file van phong.` }); e.target.value = '';
  };
  const loadTranslate = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setTranslateSource((await readTxt(f)).slice(0, MAX)); e.target.value = ''; };
  const runTranslate = () => translateSource.trim() ? runAI(`Dich doan sau sang ${translateTarget}, giu y nghia va ten rieng:\n${translateSource.slice(0, MAX)}`, setTranslateResult) : setAlert({ type: 'warning', message: 'Nhap noi dung can dich.' });
  const loadDraft = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setDraftName(f.name); setDraftText((await readTxt(f)).slice(0, MAX)); e.target.value = ''; };
  const runDraft = () => draftText.trim() ? runAI(
    `Doc ban thao cu sau va viet tiep.\nSo chuong: ${Math.max(1, Math.min(12, chapters))}\nMoi chuong khoang: ${Math.max(300, Math.min(3500, words))} chu\nGhi chu them: ${moreNote || 'khong'}\nBan thao:\n${draftText.slice(-MAX)}\nFormat: Chuong 1..., Chuong 2...`,
    setDraftResult
  ) : setAlert({ type: 'warning', message: 'Hay tai file truyen cu truoc.' });
  const runAssist = (a: EditAction) => {
    if (!assistIn.trim()) return setAlert({ type: 'warning', message: 'Nhap doan can xu ly.' });
    const p = a === 'fix' ? `Sua chinh ta va ngu phap:\n${assistIn}` : a === 'summary' ? `Tom tat 5-8 y chinh:\n${assistIn}` : `Goi y 12 ten chuong hay:\n${assistIn}`;
    runAI(p, setAssistOut);
  };
  const saveTool = (t: string, c: string, type: Story['type']) => c.trim()
    ? saveStories([{ id: `story-${Date.now()}`, title: t, content: c, type, updatedAt: new Date().toISOString() }, ...stories])
    : setAlert({ type: 'warning', message: 'Khong co noi dung de luu.' });

  return (
    <div className={cn('min-h-screen font-sans transition-colors duration-300 selection:bg-orange-100', theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-amber-50 via-orange-50 to-white text-slate-800')}>
      <ApiDashboardModal isOpen={showApi} onClose={() => setShowApi(false)} apiKeys={apiKeys} onUpdateKeys={(x) => { setApiKeys(x); StorageManager.setItem('api_keys', x); }} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      {alert && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] max-w-2xl px-4"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

      <nav className={cn('fixed top-0 left-0 right-0 h-20 border-b z-50 flex items-center justify-between px-6 backdrop-blur-md', theme === 'dark' ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-orange-100 shadow-[0_8px_30px_rgba(120,53,15,0.08)]')}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('stories'); setSelected(null); setEditing(false); }}>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg font-bold text-white">TTD</div>
          <span className="text-xl font-serif font-bold hidden sm:block tracking-tight">Truyen Tu Do</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" onClick={toggleTheme}>{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</Button>
          <Button variant={activeKey ? 'primary' : 'danger'} size="md" onClick={() => setShowApi(true)} className="flex items-center gap-2"><Key className="w-4 h-4" /><span className="hidden md:block text-xs">{activeKey ? 'API san sang' : 'Cai API'}</span></Button>
          <Button variant="ghost" size="md" onClick={() => setShowProfile(true)}><User className="w-5 h-5" /></Button>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-40">
        {selected && !editing ? (
          <div className="max-w-4xl mx-auto">
            <Button onClick={() => setSelected(null)} variant="ghost" className="flex items-center gap-2 mb-8"><ChevronLeft /> Quay lai</Button>
            <div className={cn('p-10 rounded-[40px] border shadow-sm', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}>
              <h1 className="text-4xl font-serif font-bold mb-8">{selected.title}</h1>
              <div className="prose prose-slate max-w-none text-lg whitespace-pre-wrap leading-[1.8] opacity-90"><ReactMarkdown>{selected.content}</ReactMarkdown></div>
            </div>
            <div className="mt-10 flex flex-wrap gap-4"><Button loading={loading} onClick={() => continueSelected(selected)} className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Viet tiep</Button><Button variant="secondary" onClick={() => { setEditing(true); setTitle(selected.title); setContent(selected.content); }} className="flex items-center gap-2">Chinh sua</Button></div>
          </div>
        ) : editing ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-10"><Button variant="ghost" onClick={() => { setEditing(false); setSelected(null); setTitle(''); setContent(''); }}><ChevronLeft className="w-6 h-6" /></Button><div className="flex gap-4"><Button variant="secondary" onClick={() => runAI(`Tao dan y chi tiet cho truyen "${title}".`, setContent)} loading={loading}>Tao dan y</Button><Button onClick={saveCurrentStory}>Luu tac pham</Button></div></div>
            <div className="space-y-8"><Input value={title} onChange={(e) => setTitle(e.target.value)} label="Tieu de" className="text-3xl font-serif font-bold" /><TextArea value={content} onChange={(e) => setContent(e.target.value)} label="Noi dung" className="min-h-[60vh] text-lg" /></div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-8">
              <div><h2 className="text-6xl font-serif font-bold tracking-tight mb-8">Thu vien</h2><div className="flex flex-col gap-3">{(['stories', 'characters', 'tools'] as View[]).map((v) => <Button key={v} variant={view === v ? 'primary' : 'secondary'} size="md" onClick={() => setView(v)} className="flex items-center gap-3 w-fit">{v === 'stories' && <BookOpen className="w-4 h-4" />}{v === 'characters' && <Users className="w-4 h-4" />}{v === 'tools' && <Settings className="w-4 h-4" />}{v === 'stories' ? 'Truyen' : v === 'characters' ? 'Nhan vat' : 'Cong cu AI'}</Button>)}</div></div>
              {view === 'stories' && <div className="flex flex-wrap justify-end gap-4 md:mt-20"><Button onClick={() => { setEditing(true); setSelected(null); setTitle(''); setContent(''); }} className="flex items-center gap-3"><Plus className="w-5 h-5" /> Viet truyen moi</Button></div>}
            </div>
            {view === 'stories' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">{(['original', 'translated', 'continued'] as Story['type'][]).map((type) => <div key={type} className="space-y-6"><div className="flex items-center gap-3"><div className={cn('p-3 rounded-xl text-white shadow-lg', type === 'original' ? 'bg-indigo-600' : type === 'translated' ? 'bg-teal-600' : 'bg-amber-600')}>{type === 'original' ? <BookOpen /> : type === 'translated' ? <Languages /> : <Sparkles />}</div><div><h3 className="font-serif font-bold text-xl">{type === 'original' ? 'Truyen sang tac' : type === 'translated' ? 'Truyen da dich' : 'Truyen viet tiep'}</h3><p className="text-xs opacity-40 uppercase">{stories.filter((s) => s.type === type).length} tac pham</p></div></div><div className="space-y-4">{stories.filter((s) => s.type === type).length ? stories.filter((s) => s.type === type).map((s) => <div key={s.id} onClick={() => setSelected(s)} className={cn('p-6 rounded-[28px] border transition-all cursor-pointer hover:shadow-xl group relative', theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-orange-100 hover:border-orange-300')}><button onClick={(e) => { e.stopPropagation(); if (window.confirm('Xoa truyen nay?')) saveStories(stories.filter((x) => x.id !== s.id)); }} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button><h4 className="font-serif font-bold text-lg mb-2 line-clamp-1">{s.title}</h4><p className="text-xs opacity-60 line-clamp-3">{s.content}</p></div>) : <div className="p-10 border-2 border-dashed rounded-[28px] opacity-30 text-center font-bold">Chua co tac pham</div>}</div></div>)}</div>}
            {view === 'tools' && <div className="space-y-8">
              <h3 className="text-4xl font-serif font-bold">Bo cong cu AI nang cao</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={cn('p-8 rounded-[30px] border', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}><h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Brain className="w-5 h-5" /> AI hoc van phong</h4><p className="text-sm opacity-70 mb-3">Tai file van phong de AI hoc cach hanh van.</p><input ref={styleRef} type="file" multiple className="hidden" onChange={loadStyleFiles} /><div className="flex gap-3"><Button onClick={() => styleRef.current?.click()} className="flex-1 flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Nap file mau</Button><Button variant="secondary" onClick={() => { setStyleCorpus(''); StorageManager.removeItem('style_corpus'); }}>Xoa mau</Button></div></div>
                <div className={cn('p-8 rounded-[30px] border', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}><h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Download className="w-5 h-5" /> Backup du lieu</h4><p className="text-sm opacity-70 mb-6">Xuat toan bo du lieu thanh file JSON.</p><Button onClick={() => { const d = StorageManager.exportData(); const b = new Blob([d], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `truyentudo-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(u); }} className="w-full">Tai backup</Button></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={cn('p-8 rounded-[30px] border', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}><h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Languages className="w-5 h-5" /> Dich truyen</h4><input ref={transRef} type="file" className="hidden" onChange={loadTranslate} /><div className="flex gap-3 mb-3"><Button variant="secondary" onClick={() => transRef.current?.click()}>Tai file can dich</Button><select className="rounded-lg border border-orange-200 px-3 py-2 bg-white text-sm" value={translateTarget} onChange={(e) => setTranslateTarget(e.target.value)}><option>Tieng Viet</option><option>Tieng Anh</option><option>Tieng Trung</option><option>Tieng Nhat</option></select></div><TextArea value={translateSource} onChange={(e) => setTranslateSource(e.target.value)} placeholder="Noi dung can dich..." className="min-h-[130px]" /><div className="flex gap-3 mt-3"><Button onClick={runTranslate} loading={loading}>Dich bang AI</Button><Button variant="secondary" onClick={() => saveTool(`Ban dich ${new Date().toLocaleString()}`, translateResult, 'translated')}>Luu ban dich</Button></div><TextArea value={translateResult} onChange={(e) => setTranslateResult(e.target.value)} placeholder="Ket qua dich..." className="min-h-[150px] mt-3" /></div>
                <div className={cn('p-8 rounded-[30px] border', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}><h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Viet tiep tu file cu</h4><input ref={draftRef} type="file" className="hidden" onChange={loadDraft} /><div className="flex gap-3 mb-3"><Button variant="secondary" onClick={() => draftRef.current?.click()}>Tai file truyen cu</Button><p className="text-xs opacity-70 self-center line-clamp-1">{draftName || 'Chua chon file'}</p></div><div className="grid grid-cols-2 gap-3 mb-3"><Input type="number" label="So chuong" value={chapters} onChange={(e) => setChapters(Number(e.target.value))} min={1} max={12} /><Input type="number" label="Chu moi chuong" value={words} onChange={(e) => setWords(Number(e.target.value))} min={300} max={3500} /></div><TextArea value={moreNote} onChange={(e) => setMoreNote(e.target.value)} placeholder="Ghi chu them..." className="min-h-[90px]" /><div className="flex gap-3 mt-3"><Button onClick={runDraft} loading={loading}>Tao chuong tiep</Button><Button variant="secondary" onClick={() => saveTool(`Viet tiep ${new Date().toLocaleDateString()}`, draftResult, 'continued')}>Luu ket qua</Button></div><TextArea value={draftResult} onChange={(e) => setDraftResult(e.target.value)} placeholder="Noi dung viet tiep..." className="min-h-[170px] mt-3" /></div>
              </div>
              <div className={cn('p-8 rounded-[30px] border', theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100')}><h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Wand2 className="w-5 h-5" /> Tro ly bien tap</h4><TextArea value={assistIn} onChange={(e) => setAssistIn(e.target.value)} placeholder="Dan doan van can xu ly..." className="min-h-[130px]" /><div className="flex flex-wrap gap-3 mt-3"><Button variant="secondary" onClick={() => runAssist('fix')} loading={loading}>Sua chinh ta</Button><Button variant="secondary" onClick={() => runAssist('summary')} loading={loading}>Tom tat</Button><Button variant="secondary" onClick={() => runAssist('title')} loading={loading}>Goi y ten chuong</Button></div><TextArea value={assistOut} onChange={(e) => setAssistOut(e.target.value)} placeholder="Ket qua..." className="min-h-[150px] mt-3" /></div>
            </div>}
          </div>
        )}
      </main>

      {loading && <div className={cn('fixed inset-0 z-[999] flex flex-col items-center justify-center backdrop-blur-xl', theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/70')}><div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-300 border-t-orange-600 mb-8" /><h3 className="text-2xl font-serif font-bold">AI dang xu ly...</h3></div>}
    </div>
  );
}

export default function App() {
  return <AuthProvider><ErrorBoundary><AppContent /></ErrorBoundary></AuthProvider>;
}
