import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ResumePlayer from '@/nova/components/ResumePlayer';
import { getRelatedTitles } from '@/nova/related-catalog';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function openPlayer() {
  render(<ResumePlayer title="Demon Slayer" onClose={vi.fn()} />);
  const video = document.querySelector('video');
  if (!video) throw new Error('Video missing');
  Object.defineProperty(video, 'duration', { configurable: true, value: 60 });
  fireEvent.loadedMetadata(video);
  return video;
}

describe('sample player interactions', () => {
  it('excludes the current title and prioritizes related genres', () => {
    expect(getRelatedTitles('Dark Matter')[0]?.title).toBe('Neon Dreams');
    expect(getRelatedTitles('Neon Dreams').map(item => item.title)).not.toContain('Neon Dreams');
    expect(getRelatedTitles('Neon Dreams')[0]?.title).toBe('Barcode');
  });

  it('starts the sample video after loading', () => {
    openPlayer();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('rewinds the video by 10 seconds', () => {
    const video = openPlayer();
    video.currentTime = 25;
    fireEvent.click(screen.getByRole('button', { name: 'Rewind 10 seconds' }));
    expect(video.currentTime).toBe(15);
  });

  it('forwards the video by 10 seconds', () => {
    const video = openPlayer();
    video.currentTime = 25;
    fireEvent.click(screen.getByRole('button', { name: 'Forward 10 seconds' }));
    expect(video.currentTime).toBe(35);
  });

  it('seeks without going beyond the beginning or end', () => {
    const video = openPlayer();
    video.currentTime = 5;
    fireEvent.click(screen.getByRole('button', { name: 'Rewind 10 seconds' }));
    expect(video.currentTime).toBe(0);
    video.currentTime = 55;
    fireEvent.click(screen.getByRole('button', { name: 'Forward 10 seconds' }));
    expect(video.currentTime).toBe(60);
  });

  it('changes the actual playback speed through settings', () => {
    const video = openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Player settings' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Speed' }));
    fireEvent.click(screen.getByRole('button', { name: '1.5×' }));
    expect(video.playbackRate).toBe(1.5);
  });

  it('saves watchlist selection and restores it when reopened', () => {
    openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Watchlist' }));
    expect(localStorage.getItem('nova-watchlist:Demon Slayer')).toBe('true');
    cleanup();
    openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Watchlist' }));
    expect(localStorage.getItem('nova-watchlist:Demon Slayer')).toBe('false');
  });

  it('rates a title from the Rate menu and restores the choice', () => {
    openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Rate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Love this!' }));
    expect(localStorage.getItem('nova-rating:Demon Slayer')).toBe('love');
    cleanup();
    openPlayer();
    expect(screen.getByRole('button', { name: 'Rate' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('plays a related title with its own saved progress and watchlist', () => {
    localStorage.setItem('nova-resume:Shadow Protocol', '12');
    localStorage.setItem('nova-watchlist:Shadow Protocol', 'true');
    const previousVideo = openPlayer();
    previousVideo.currentTime = 7;
    fireEvent.click(screen.getByRole('button', { name: 'Watch related Shadow Protocol' }));
    const video = document.querySelector('video');
    if (!video) throw new Error('Related video missing');
    Object.defineProperty(video, 'duration', { configurable: true, value: 60 });
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(12);
    expect(localStorage.getItem('nova-resume:Demon Slayer')).toBe('7');
    expect(screen.getByRole('button', { name: 'Watchlist' })).toHaveAttribute('aria-pressed', 'true');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it('restores per-title playback position', () => {
    localStorage.setItem('nova-resume:Demon Slayer', '18');
    const video = openPlayer();
    expect(video.currentTime).toBe(18);
    video.currentTime = 24;
    fireEvent.timeUpdate(video);
    expect(localStorage.getItem('nova-resume:Demon Slayer')).toBe('24');
  });

  it('shares a URL that identifies the selected title', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const sharedUrl = writeText.mock.calls[0]?.[0];
    if (typeof sharedUrl !== 'string') throw new Error('Shared URL missing');
    const url = new URL(sharedUrl);
    expect(url.searchParams.get('watch')).toBe('Demon Slayer');
  });

  it('requests fullscreen for the video stage', async () => {
    const video = openPlayer();
    const stage = video.parentElement;
    if (!stage) throw new Error('Video stage missing');
    const request = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stage, 'requestFullscreen', { configurable: true, value: request });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' })));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('shows normal screen lock without popups, hides fullscreen, and opens settings from the side only on TV screen', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV',
    );
    openPlayer();

    expect(screen.queryByRole('button', { name: 'Enter fullscreen' })).toBeNull();
    const lockBtn = screen.getByRole('button', { name: 'Lock screen' });
    fireEvent.click(screen.getByRole('button', { name: 'Player settings' }));
    expect(screen.getByRole('group', { name: 'Playback settings' })).toHaveAttribute('data-side', 'right');
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));

    fireEvent.click(lockBtn);
    expect(screen.queryByText(/Screen Locked/i)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rewind 10 seconds' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Player settings' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Unlock screen' }));
    expect(screen.getByRole('button', { name: 'Rewind 10 seconds' })).toBeInTheDocument();
  });

  it('hides screen lock and opens settings from the bottom on mobile screens', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
    );
    openPlayer();

    expect(screen.queryByRole('button', { name: 'Lock screen' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Player settings' }));
    expect(screen.getByRole('group', { name: 'Playback settings' })).toHaveAttribute('data-side', 'bottom');
  });

  it('shows Cast icon on top of any playing video and handles cast action', async () => {
    openPlayer();
    const castBtn = screen.getByRole('button', { name: 'Cast video' });
    expect(castBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(castBtn);
    });
    expect(screen.getByRole('dialog', { name: 'Cast to device' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close cast panel' }));
    expect(screen.queryByRole('dialog', { name: 'Cast to device' })).toBeNull();
  });

  it('opens Watch Next and Something Similar without Episodes when pressing ArrowDown on a movie on TV', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV',
    );
    render(<ResumePlayer title="Shadow Protocol" contentType="movie" onClose={vi.fn()} />);

    expect(screen.queryByText('Now Playing')).toBeNull();
    expect(screen.getByTestId('tv-player-title')).toHaveTextContent('Shadow Protocol');
    expect(screen.queryByRole('button', { name: 'Cast video' })).toBeNull();
    expect(screen.queryByTestId('tv-player-shelf')).toBeNull();

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    const shelf = screen.getByTestId('tv-player-shelf');
    expect(shelf).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close browse panel' })).toBeNull();
    expect(screen.queryByText('Hide')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Watch Next' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Something Similar' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Episodes' })).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Something Similar' }));
    expect(screen.getByRole('button', { name: 'Play similar Crimson Veil' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.queryByTestId('tv-player-shelf')).toBeNull();
  });

  it('opens Watch Next, Something Similar, and Episodes with Season 1, 2, 3 when pressing ArrowDown on a serial on TV', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV',
    );
    render(<ResumePlayer title="Demon Slayer" contentType="series" onClose={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByTestId('tv-player-shelf')).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: 'Watch Next' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Something Similar' })).toBeInTheDocument();
    const episodesTab = screen.getByRole('tab', { name: 'Episodes' });
    expect(episodesTab).toBeInTheDocument();

    fireEvent.click(episodesTab);
    expect(screen.getByRole('tab', { name: 'Season 1' })).toBeInTheDocument();
    const season2Tab = screen.getByRole('tab', { name: 'Season 2' });
    expect(season2Tab).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Season 3' })).toBeInTheDocument();

    fireEvent.click(season2Tab);
    const s2Ep1 = screen.getByRole('button', { name: /Play Demon Slayer Season 2 Episode 1/i });
    expect(s2Ep1).toBeInTheDocument();

    fireEvent.click(s2Ep1);
    expect(screen.getByTestId('tv-player-title')).toHaveTextContent('Demon Slayer · S2:E1');
    expect(screen.queryByTestId('tv-player-shelf')).toBeNull();
  });

  it('hides the bottom Watch Next button and opens equal-sized Watch Next cards on mouse wheel down', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV',
    );
    render(<ResumePlayer title="Demon Slayer" contentType="series" onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Browse Watch Next and more' })).toBeNull();
    expect(screen.queryByText(/Something Similar/i)).toBeNull();

    const stage = document.querySelector('[data-tv-player="true"]');
    if (!stage) throw new Error('TV stage missing');
    fireEvent.wheel(stage, { deltaY: 60 });

    const shelf = screen.getByTestId('tv-player-shelf');
    expect(shelf).toBeInTheDocument();
    const cards = screen.getAllByTestId('watch-next-card');
    expect(cards.length).toBeGreaterThan(1);
    const widths = new Set(cards.map(card => card.className));
    expect(widths.size).toBe(1);
  });

  it('shows Skip Intro only during the movie intro above the timeline, hides once intro ends, and skips short video clips', () => {
    const video = openPlayer();
    const skipBtn = screen.getByRole('button', { name: 'Skip Intro' });
    expect(skipBtn).toBeInTheDocument();
    expect(skipBtn).toHaveClass('nova-pill-solid');
    expect(skipBtn.querySelector('svg')).toBeNull();

    // Advances past the 15s intro naturally: Skip Intro disappears.
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 15 });
    fireEvent.timeUpdate(video);
    expect(screen.queryByRole('button', { name: 'Skip Intro' })).toBeNull();

    // Clicking Skip Intro during the intro jumps to 15s and hides the button.
    cleanup();
    const video2 = openPlayer();
    const skipBtn2 = screen.getByRole('button', { name: 'Skip Intro' });
    fireEvent.click(skipBtn2);
    expect(video2.currentTime).toBe(15);
    expect(screen.queryByRole('button', { name: 'Skip Intro' })).toBeNull();

    // Short video clips do not show Skip Intro.
    cleanup();
    render(<ResumePlayer title="Car Chase" contentType="video" onClose={vi.fn()} />);
    const clip = document.querySelector('video')!;
    Object.defineProperty(clip, 'duration', { configurable: true, value: 60 });
    fireEvent.loadedMetadata(clip);
    expect(screen.queryByRole('button', { name: 'Skip Intro' })).toBeNull();
  });

  it('shows four languages up top with Kannada and More below, and hides the rows 1 minute after one is picked', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    try {
      for (const ua of [
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV',
      ]) {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
        localStorage.clear();
        render(<ResumePlayer title="Shadow Protocol" contentType="movie" onClose={onClose} />);

        expect(screen.queryByRole('button', { name: 'Select Language' })).toBeNull();
        const topRow = screen.getByTestId('lang-row-top');
        const bottomRow = screen.getByTestId('lang-row-bottom');
        expect(within(topRow).getAllByRole('button').map(b => b.textContent)).toEqual(['English', 'Hindi', 'Tamil', 'Telugu']);
        expect(within(bottomRow).getAllByRole('button').map(b => b.textContent)).toEqual(['Kannada', 'More']);
        expect(within(topRow).getByText('English').closest('button')?.querySelector('svg')).toBeNull();
        expect(within(topRow).getByText('Hindi').closest('button')).toHaveAttribute('aria-pressed', 'true');

        if (ua.includes('TV')) {
          // On TV the rows sit over the video above the timeline and do not fade out with the other controls.
          const strip = screen.getByTestId('language-strip');
          const tvStrip = strip.closest('[data-testid="tv-language-strip"]');
          expect(tvStrip).not.toBeNull();
          expect(tvStrip?.className).toContain('pointer-events-none');
          expect(strip.className).toContain('pointer-events-auto');
          expect(strip.closest('.nova-player-shade')).toBeNull();
        }

        // More opens Player Settings straight on Audio Language; closing it without picking brings the rows back.
        fireEvent.click(within(bottomRow).getByRole('button', { name: 'More Languages' }));
        const sheet = screen.getByRole('group', { name: 'Playback settings' });
        expect(within(sheet).getByRole('tab', { name: 'Audio Language' })).toHaveAttribute('aria-selected', 'true');
        fireEvent.click(sheet.parentElement!);
        expect(screen.queryByRole('group', { name: 'Playback settings' })).toBeNull();
        expect(screen.getByTestId('language-strip')).toBeInTheDocument();

        // Picking a language applies it, stays visible for 1 minute, then hides.
        fireEvent.click(within(screen.getByTestId('lang-row-top')).getByText('Tamil').closest('button')!);
        expect(localStorage.getItem('nova-app-language')).toBe('Tamil');
        expect(screen.getByTestId('language-strip')).toBeInTheDocument();
        act(() => { vi.advanceTimersByTime(59_000); });
        expect(screen.getByTestId('language-strip')).toBeInTheDocument();
        act(() => { vi.advanceTimersByTime(1_000); });
        expect(screen.queryByTestId('language-strip')).toBeNull();
        cleanup();
      }
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('puts a saved language the rows do not show in the bottom slot', () => {
    localStorage.setItem('nova-app-language', 'Bengali');
    render(<ResumePlayer title="Shadow Protocol" contentType="movie" onClose={vi.fn()} />);
    const bottomRow = screen.getByTestId('lang-row-bottom');
    expect(within(bottomRow).getAllByRole('button').map(b => b.textContent)).toEqual(['Bengali', 'More']);
    expect(within(bottomRow).getByText('Bengali').closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the language rows 2 minutes after the video opens', () => {
    vi.useFakeTimers();
    try {
      render(<ResumePlayer title="Shadow Protocol" onClose={vi.fn()} />);
      expect(screen.getByTestId('language-strip')).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(119_000); });
      expect(screen.getByTestId('language-strip')).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(1_000); });
      expect(screen.queryByTestId('language-strip')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the full Audio Language list in Player Settings and dynamically switches HLS audio and text tracks', async () => {
    const HlsMod = (await import('hls.js')).default;
    const listeners = new Map<string, () => void>();
    const fakeHls = {
      audioTracks: [
        { id: 0, name: 'Hindi', lang: 'hi' },
        { id: 1, name: 'English', lang: 'en' },
        { id: 2, name: 'Tamil', lang: 'ta' },
      ],
      subtitleTracks: [
        { id: 0, name: 'English', lang: 'en' },
        { id: 1, name: 'Hindi', lang: 'hi' },
      ],
      audioTrack: 0,
      subtitleTrack: -1,
      subtitleDisplay: false,
      on: vi.fn((event: string, cb: () => void) => {
        listeners.set(event, cb);
      }),
      loadSource: vi.fn(),
      attachMedia: vi.fn(),
      destroy: vi.fn(),
    };

    const { switchHlsAudioTrack, switchHlsSubtitleTrack } = await import('@/nova/hls-tracks');
    const mockTextTracks = [
      { kind: 'subtitles', language: 'en', label: 'English', mode: 'disabled' },
      { kind: 'subtitles', language: 'hi', label: 'Hindi', mode: 'disabled' },
    ] as unknown as TextTrackList;
    const mockVideo = { textTracks: mockTextTracks } as unknown as HTMLVideoElement;

    expect(switchHlsAudioTrack(fakeHls as unknown as InstanceType<typeof HlsMod>, mockVideo, 'Tamil')).toBe(2);
    expect(fakeHls.audioTrack).toBe(2);

    expect(switchHlsSubtitleTrack(fakeHls as unknown as InstanceType<typeof HlsMod>, mockVideo, 'English')).toBe(0);
    expect(fakeHls.subtitleTrack).toBe(0);
    expect(fakeHls.subtitleDisplay).toBe(true);
    expect(mockTextTracks[0]!.mode).toBe('showing');
    expect(mockTextTracks[1]!.mode).toBe('disabled');

    expect(switchHlsSubtitleTrack(fakeHls as unknown as InstanceType<typeof HlsMod>, mockVideo, 'Off')).toBe(-1);
    expect(fakeHls.subtitleTrack).toBe(-1);
    expect(fakeHls.subtitleDisplay).toBe(false);
    expect(mockTextTracks[0]!.mode).toBe('disabled');

    // Verify full 30-language list still exists in SettingsSheet
    render(<ResumePlayer title="Shadow Protocol" contentType="movie" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Player settings' }));
    const settingsPanel = screen.getByRole('group', { name: 'Playback settings' });
    fireEvent.click(screen.getByRole('tab', { name: 'Audio Language' }));
    const list = settingsPanel.querySelector('ul');
    if (!list) throw new Error('Audio language list missing');
    expect(list.querySelectorAll('li')).toHaveLength(30);
    expect(within(list).getByText('Japanese')).toBeInTheDocument();
  });

  it('replaces Report an Issue with Report a Problem inside player settings', () => {
    openPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Player settings' }));
    expect(screen.queryByRole('button', { name: 'Report an Issue' })).toBeNull();
    const reportBtn = screen.getByRole('button', { name: 'Report a Problem' });
    expect(reportBtn).toBeInTheDocument();

    fireEvent.click(reportBtn);
    const reportDialog = screen.getByRole('group', { name: 'Report a problem' });
    expect(reportDialog).toBeInTheDocument();
    expect(within(reportDialog).getByText('Report a Problem')).toBeInTheDocument();
  });

  it('opens Smart Features for You with Back-only close, cleaned Co-Watch QR/Room ID, Family Safe Mode, and X-Ray Scene Info side-panel', async () => {
    const video = openPlayer();
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    fireEvent.loadedMetadata(video);

    const smartPill = screen.getByTestId('smart-features-pill');
    expect(smartPill).toBeInTheDocument();
    expect(smartPill).toHaveTextContent('Smart Features');
    expect(smartPill.querySelector('svg')).toBeNull();
    expect(smartPill.className).toContain('rounded-full');
    expect(smartPill.className).toContain('nova-smart-pill');

    // Remains visible during playback even after intro ends.
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 20 });
    fireEvent.timeUpdate(video);
    expect(screen.getByTestId('smart-features-pill')).toBeInTheDocument();

    fireEvent.click(smartPill);
    const panel = screen.getByTestId('smart-features-panel');
    expect(panel).toBeInTheDocument();

    // Header: Colorful "Smart Features for You" + Back switch only (no X cross icon)
    expect(within(panel).getByRole('heading', { name: 'Smart Features for You' })).toBeInTheDocument();
    expect(within(panel).getByTestId('smart-features-back-btn')).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /Close Smart Features icon/i })).toBeNull();

    // 1. Co-Watch tab: QR Code, white-highlighted labels, Room ID
    const coWatchCard = within(panel).getByTestId('tv-cowatch-card');
    expect(within(coWatchCard).getByText('Invite your friends to watch together')).toBeInTheDocument();
    expect(within(coWatchCard).getByTestId('cowatch-qr-block').querySelector('svg')).not.toBeNull();
    expect(within(coWatchCard).getByText('Scan QR code to your phone')).toBeInTheDocument();
    expect(within(coWatchCard).getByText('Room ID')).toBeInTheDocument();
    const roomIdEl = within(coWatchCard).getByTestId('cowatch-room-id');
    expect(roomIdEl.textContent).toMatch(/^CW-\d{4}$/);

    expect(within(panel).queryByText(/Open Preview/i)).toBeNull();
    expect(within(panel).queryByText(/Open in New Tab/i)).toBeNull();
    expect(within(panel).queryByText(/Create Room/i)).toBeNull();
    expect(within(panel).queryByText(/Scan QR code to join on phone/i)).toBeNull();

    // 2. Dialogue Boost: Restored & interactive (toggle switch + Low/Medium/High presets)
    fireEvent.click(within(panel).getByRole('button', { name: /Dialogue Boost/i }));
    const dialoguePanel = within(panel).getByTestId('dialogue-boost-panel');
    const boostSwitch = within(dialoguePanel).getByRole('switch', { name: /Enhance Speech Clarity/i });
    expect(boostSwitch).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(boostSwitch);
    expect(boostSwitch).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('nova-dialogue-boost-enabled')).toBe('true');

    fireEvent.click(within(dialoguePanel).getByRole('button', { name: /High/i }));
    expect(localStorage.getItem('nova-dialogue-boost-level')).toBe('high');
    expect(within(dialoguePanel).getByTestId('dialogue-boost-status')).toHaveTextContent(/High/i);

    // 3. Family Safe Mode & Scene Info remain visible, open nothing of their own, and open Premium Popup with Back icon
    const familyBtn = within(panel).getByRole('button', { name: /Family Safe Mode/i });
    const sceneBtn = within(panel).getByRole('button', { name: /Scene Info/i });
    expect(familyBtn).toBeInTheDocument();
    expect(sceneBtn).toBeInTheDocument();

    fireEvent.click(familyBtn);
    expect(within(panel).queryByRole('switch', { name: /Auto-Mute Profanity/i })).toBeNull();
    const familyPopup = screen.getByTestId('future-feature-popup');
    expect(within(familyPopup).getByText('Family Safe Mode')).toBeInTheDocument();
    expect(within(familyPopup).getByRole('heading', { name: 'Next feature for you in future' })).toBeInTheDocument();
    fireEvent.click(within(familyPopup).getByTestId('future-feature-back-btn'));
    expect(screen.queryByTestId('future-feature-popup')).toBeNull();

    fireEvent.click(sceneBtn);
    expect(screen.queryByTestId('scene-info-card')).toBeNull();
    const scenePopup = screen.getByTestId('future-feature-popup');
    expect(within(scenePopup).getByText('Scene Info')).toBeInTheDocument();
    expect(within(scenePopup).getByRole('heading', { name: 'Next feature for you in future' })).toBeInTheDocument();
    fireEvent.click(within(scenePopup).getByTestId('future-feature-back-btn'));
    expect(screen.queryByTestId('future-feature-popup')).toBeNull();

    // Back switch in Smart Features closes overlay cleanly
    fireEvent.click(screen.getByTestId('smart-features-back-btn'));
    expect(screen.queryByTestId('smart-features-panel')).toBeNull();

      // Verify real-time server room hub permission enforcement & SSE state logic
      const hub = await import('@/lib/cowatch-hub.server');
      const created = hub.createCoWatchRoom({
        roomId: 'CW-8492',
        title: 'Shadow Protocol',
        hostId: 'host-1',
        controlMode: 'host-only',
      });
      expect(created.roomId).toBe('CW-8492');
      hub.joinCoWatchRoom({ roomId: 'CW-8492', participantId: 'guest-1', name: 'Aarav' });

      const blocked = hub.syncCoWatchPlayback({
        roomId: 'CW-8492',
        actorId: 'guest-1',
        playing: true,
        currentTime: 42,
      });
      expect(blocked.ok).toBe(false);
      if (!blocked.ok) expect(blocked.status).toBe(403);

      hub.setCoWatchControlMode({ roomId: 'CW-8492', actorId: 'host-1', controlMode: 'everyone' });
      const allowed = hub.syncCoWatchPlayback({
        roomId: 'CW-8492',
        actorId: 'guest-1',
        playing: true,
        currentTime: 42,
      });
      expect(allowed.ok).toBe(true);
      if (allowed.ok) expect(allowed.room.currentTime).toBe(42);

      const chatRes = hub.addCoWatchMessage({
        roomId: 'CW-8492',
        id: 'm1',
        author: 'Aarav',
        kind: 'chat',
        text: 'Awesome scene!',
      });
      expect(chatRes.ok).toBe(true);
      if (chatRes.ok) expect(chatRes.room.messages).toHaveLength(1);

    const ended = hub.endCoWatchRoom({ roomId: 'CW-8492', actorId: 'host-1' });
    expect(ended.ok).toBe(true);
    if (ended.ok) expect(ended.room.closed).toBe(true);
  });
});