import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  AudioLines,
  Crown,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  DIALOGUE_BOOST_PRESETS,
  type DialogueBoostLevel,
  type DialogueBoostStatus,
} from '@/nova/smart-audio';

export type SmartFeatureTab = 'cowatch' | 'dialogue' | 'family' | 'scene';

type SmartFeaturesOverlayProps = {
  dialogueBoostEnabled: boolean;
  dialogueBoostLevel: DialogueBoostLevel;
  dialogueBoostStatus: DialogueBoostStatus;
  onToggleDialogueBoost: () => void;
  onSelectDialogueBoostLevel: (level: DialogueBoostLevel) => void;
  roomId: string;
  companionUrl: string;
  onEnsureHostRoom: () => Promise<string>;
  onClose: () => void;
};

function RemoteToggleSwitch({
  id,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      data-dpad-item="true"
      aria-checked={checked}
      onClick={onToggle}
      className={`tv-focusable flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left focus-visible:outline-none sm:p-5 ${
        checked
          ? 'border-[#c084fc]/60 bg-white/[0.11]'
          : 'border-white/12 bg-white/[0.04] hover:bg-white/[0.08]'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-white sm:text-base">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-white/85">
          {checked ? 'ON' : 'OFF'}
        </span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            checked ? 'bg-gradient-to-r from-[#7c3aed] to-[#ec4899]' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </span>
      </div>
    </button>
  );
}

export default function SmartFeaturesOverlay({
  dialogueBoostEnabled,
  dialogueBoostLevel,
  dialogueBoostStatus,
  onToggleDialogueBoost,
  onSelectDialogueBoostLevel,
  roomId,
  companionUrl,
  onEnsureHostRoom,
  onClose,
}: SmartFeaturesOverlayProps) {
  const [activeTab, setActiveTab] = useState<'cowatch' | 'dialogue'>('cowatch');
  const [futurePopupFeature, setFuturePopupFeature] = useState<'Family Safe Mode' | 'Scene Info' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'cowatch' && !roomId) {
      void onEnsureHostRoom();
    }
  }, [activeTab, roomId, onEnsureHostRoom]);

  useEffect(() => {
    const first = rootRef.current?.querySelector<HTMLElement>('[data-dpad-item="true"]');
    first?.focus();
  }, [futurePopupFeature]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === 'Escape' ||
      event.key === 'Backspace' ||
      event.key === 'BrowserBack' ||
      event.key === 'GoBack'
    ) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' && event.key === 'Backspace') return;
      event.preventDefault();
      event.stopPropagation();
      if (futurePopupFeature) {
        setFuturePopupFeature(null);
      } else {
        onClose();
      }
      return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT') return;

    const items = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-dpad-item="true"]:not([disabled])') ?? [],
    );
    if (items.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  const effectiveCompanionUrl =
    companionUrl || `/cowatch?room=${encodeURIComponent(roomId || 'CW-8492')}`;
  const currentPreset = DIALOGUE_BOOST_PRESETS[dialogueBoostLevel];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Smart Features for You"
      data-testid="smart-features-panel"
      onKeyDown={handleKeyDown}
      className="pointer-events-auto fixed inset-0 z-[140] flex flex-col overflow-y-auto bg-[#0f1219]/[0.92] text-white"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7">
        {/* Header: Back Switch Only + Larger Colorful Title (No X cross icon) */}
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            data-dpad-item="true"
            data-testid="smart-features-back-btn"
            aria-label="Back"
            onClick={onClose}
            className="tv-focusable inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 text-xs font-semibold text-white hover:bg-white/[0.16] focus-visible:outline-none sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <h2 className="bg-gradient-to-r from-[#c084fc] via-[#ec4899] to-[#fbbf24] bg-clip-text text-center text-xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            Smart Features for You
          </h2>

          <div className="w-16 sm:w-20" aria-hidden="true" />
        </header>

        {/* 4-Option Navigation Bar: Co-Watch, Dialogue Boost, Family Safe Mode, Scene Info */}
        <nav
          aria-label="Smart Feature Sections"
          className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {(
            [
              { id: 'cowatch', label: 'Co-Watch', Icon: Users, locked: false },
              { id: 'dialogue', label: 'Dialogue Boost', Icon: AudioLines, locked: false },
              { id: 'family', label: 'Family Safe Mode', Icon: ShieldCheck, locked: true },
              { id: 'scene', label: 'Scene Info', Icon: Info, locked: true },
            ] as const
          ).map(({ id, label, Icon, locked }) => {
            const active = !locked && activeTab === id;
            return (
              <button
                key={id}
                type="button"
                data-dpad-item="true"
                aria-pressed={active}
                onClick={() => {
                  if (id === 'family') {
                    setFuturePopupFeature('Family Safe Mode');
                  } else if (id === 'scene') {
                    setFuturePopupFeature('Scene Info');
                  } else {
                    setActiveTab(id);
                  }
                }}
                className={`tv-focusable flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold focus-visible:outline-none sm:text-sm ${
                  active
                    ? 'border-[#c084fc]/70 bg-white/[0.14] text-white'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.09] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Section Body */}
        <main className="mt-6 flex flex-1 flex-col justify-center">
          {activeTab === 'cowatch' && (
            <section
              data-testid="tv-cowatch-card"
              aria-label="Co-Watch Room Controls"
              className="rounded-2xl border border-white/15 bg-[#0f1219]/[0.92] px-5 py-7 sm:px-8 sm:py-9"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Invite your friends to watch together
                </h3>
              </div>

              <div className="mt-8 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
                {/* Left Side: QR Code */}
                <div
                  data-testid="cowatch-qr-block"
                  className="flex flex-col items-center justify-center text-center"
                >
                  <div className="rounded-xl bg-white p-3">
                    <QRCodeSVG
                      value={effectiveCompanionUrl}
                      size={152}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0b0716"
                      aria-label={`QR code to open Mobile Companion Dashboard for room ${roomId || 'CW-8492'}`}
                    />
                  </div>
                  <p className="mt-3.5 rounded-md bg-white px-3 py-1 text-xs font-extrabold tracking-wide text-[#09080f] shadow-[0_0_14px_rgba(255,255,255,0.3)] sm:text-sm">
                    Scan QR code to your phone
                  </p>
                </div>

                {/* Middle Dividing Line */}
                <div className="h-px w-full bg-white/15 sm:hidden" aria-hidden="true" />
                <div className="hidden h-44 w-px bg-white/20 sm:block" aria-hidden="true" />

                {/* Right Side: White Highlighted Room ID */}
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="rounded-md bg-white px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#09080f] shadow-[0_0_14px_rgba(255,255,255,0.3)]">
                    Room ID
                  </p>
                  <p
                    data-testid="cowatch-room-id"
                    className="mt-3 font-mono text-3xl font-extrabold tracking-[0.16em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)] sm:text-4xl"
                  >
                    {roomId || 'CW-8492'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'dialogue' && (
            <section
              data-testid="dialogue-boost-panel"
              aria-label="Dialogue Boost Settings"
              className="rounded-2xl border border-white/15 bg-[#0f1219]/[0.92] p-6 sm:p-8"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">Dialogue Boost</h3>
                  <p className="mt-1 text-xs text-white/75 sm:text-sm">
                    Real-time Web Audio vocal clarity EQ &amp; dynamic background leveling.
                  </p>
                </div>
                <span
                  data-testid="dialogue-boost-status"
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    dialogueBoostEnabled
                      ? 'border-[#c084fc]/60 bg-[#7c3aed]/25 text-white'
                      : 'border-white/15 bg-white/[0.06] text-white/75'
                  }`}
                >
                  {dialogueBoostEnabled
                    ? dialogueBoostStatus === 'active'
                      ? `Boost Active · ${currentPreset.label}`
                      : `On · ${currentPreset.label}`
                    : 'Off'}
                </span>
              </div>

              <RemoteToggleSwitch
                id="dialogue-boost-switch"
                label="Enhance Speech Clarity"
                description="Shapes 2.6 kHz vocal presence while gently compressing loud explosions and background score."
                checked={dialogueBoostEnabled}
                onToggle={onToggleDialogueBoost}
              />

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
                  Boost Intensity
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                  {(['low', 'medium', 'high'] as const).map((lvl) => {
                    const preset = DIALOGUE_BOOST_PRESETS[lvl];
                    const selected = dialogueBoostLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        data-dpad-item="true"
                        aria-pressed={selected}
                        onClick={() => onSelectDialogueBoostLevel(lvl)}
                        className={`tv-focusable rounded-xl border px-3 py-3 text-left focus-visible:outline-none ${
                          selected
                            ? 'border-[#ec4899]/75 bg-gradient-to-r from-[#7c3aed]/25 to-[#ec4899]/20 text-white'
                            : 'border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <p className="text-sm font-bold text-white">{preset.label}</p>
                        <p className="mt-0.5 text-[11px] text-white/70">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Premium Upcoming Feature Popup for Family Safe Mode & Scene Info */}
      {futurePopupFeature && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Next feature for you in future"
          data-testid="future-feature-popup"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0f1219]/[0.92] p-4 sm:p-6"
          onClick={() => setFuturePopupFeature(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#c084fc]/45 bg-[#121521] p-6 text-center text-white shadow-[0_28px_90px_rgba(124,58,237,0.45)] sm:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.28),rgba(124,58,237,0.18)_45%,transparent_72%)]"
            />

            <div className="relative flex items-center justify-start">
              <button
                type="button"
                data-dpad-item="true"
                data-testid="future-feature-back-btn"
                aria-label="Back"
                onClick={() => setFuturePopupFeature(null)}
                className="tv-focusable inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.16] focus-visible:outline-none"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4 flex flex-col items-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#fbbf24]/40 bg-gradient-to-br from-[#7c3aed]/35 via-[#ec4899]/30 to-[#fbbf24]/25 text-[#fbbf24] shadow-[0_0_28px_rgba(236,72,153,0.35)]">
                <Crown className="h-8 w-8" />
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#c084fc]/40 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#f5d0fe]">
                <Sparkles className="h-3.5 w-3.5 text-[#ec4899]" />
                {futurePopupFeature}
              </span>

              <h3 className="mt-4 bg-gradient-to-r from-[#f5d0fe] via-[#ffffff] to-[#fbbf24] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                Next feature for you in future
              </h3>

              <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-white/75 sm:text-sm">
                This NOVA Smart TV experience is arriving soon in an upcoming release.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
