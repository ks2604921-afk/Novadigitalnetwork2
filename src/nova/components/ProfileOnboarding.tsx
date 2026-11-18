import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/nova/components/Logo';
import { APP_LANGUAGES } from '@/nova/languages';

const LANGS = APP_LANGUAGES;

export default function ProfileOnboarding({ name, onDone, initialLanguages = [], onCancel }: { name: string; onDone: (langs: string[]) => void; initialLanguages?: string[]; onCancel?: () => void }) {
  const [step, setStep] = useState<'lang' | 'welcome'>('lang');
  const [sel, setSel] = useState<string[]>(initialLanguages);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const content = step === 'welcome' ? (
    <div role="dialog" aria-label="Profile preferences" className="fixed inset-0 z-[210] flex flex-col justify-center bg-nova-black text-white">
      <Button variant="novaAction" aria-label="Back to languages" onClick={() => setStep('lang')} className="absolute left-5 top-5 z-10 text-white">
        <ChevronLeft className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />Back
      </Button>
      <div className="relative px-6 py-14 text-center">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Welcome to NOVA, {name}!</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {sel.map((l) => <span key={l} className="nova-pill rounded-full px-3 py-1 text-xs font-semibold text-white">{l}</span>)}
        </div>
        <Button variant="novaAction" onClick={() => onDone(sel)} className="nova-pill-solid mx-auto mt-8 block h-12 w-full max-w-sm rounded-full text-lg font-bold text-white">
          Get Started
        </Button>
      </div>
    </div>
  ) : (
    <div role="dialog" aria-label="Profile preferences" className="fixed inset-0 z-[210] overflow-y-auto bg-nova-black px-5 pb-32 pt-10 text-white">
      {onCancel && <Button variant="novaAction" onClick={onCancel} className="mb-4 text-white"><ChevronLeft className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />Back</Button>}
      <h1 className="text-2xl font-black text-white sm:text-3xl">What do you like to watch in?</h1>
      <p className="mt-1 text-sm text-white">Select your languages — we'll customize your home feed.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {LANGS.map((l) => {
          const on = sel.includes(l.id);
          return (
            <Button variant="novaAction" key={l.id} onClick={() => toggle(l.id)} aria-label={l.id} aria-pressed={on}
              className={`relative aspect-[4/3] h-auto overflow-hidden rounded-lg bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-nova-dark text-left transition ${on ? 'ring-2 ring-nova-accent scale-[1.02]' : 'ring-1 ring-white/20'}`}>
              <div className="absolute bottom-3 left-3">
                <p className="text-xl font-black text-white">{l.script}</p>
                <p className="text-xs text-white/95">{l.id}</p>
              </div>
              {on && <span className="nova-pill-solid absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"><Check className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /></span>}
            </Button>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-nova-black to-transparent p-5">
        <Button variant="novaAction" disabled={!sel.length} onClick={() => setStep('welcome')} className="nova-pill-solid mx-auto block h-12 w-full max-w-sm rounded-full font-bold text-white disabled:opacity-40">
          Continue
        </Button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
