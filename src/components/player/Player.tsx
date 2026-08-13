import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useMusic } from '../../context/MusicContext';
import { BACKING_TRACK_SEEDS } from '../../data/BackingTrackSeeds';
import { Button } from '../ui/Button';
import { useTranslation } from '../../context/LocaleContext';

interface PlayerProps {
  height?: string | number;
  autoplay?: boolean;
  controls?: boolean;
}

const Player: React.FC<PlayerProps> = ({
  height = '360px',
  autoplay = true,
  controls = true
}) => {
  const { t } = useTranslation();
  const { isPlaying, currentTrack, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [playerHeight, setPlayerHeight] = useState(height);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= 480) setPlayerHeight('280px');
      else if (w <= 768) setPlayerHeight('320px');
      else setPlayerHeight(height as string);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  const youtubeSeeds = useMemo(() => BACKING_TRACK_SEEDS.filter((s) => s.platform === 'youtube'), []);

  const pickNextFromSeeds = (excludeId?: string | null) => {
    if (youtubeSeeds.length === 0) return null;
    const candidates = excludeId ? youtubeSeeds.filter((s) => s.id !== excludeId) : youtubeSeeds;
    const pool = candidates.length > 0 ? candidates : youtubeSeeds;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return pick;
  };

  // Sync Play/Pause with the YouTube iframe
  useEffect(() => {
    if (!iframeRef.current || currentTrack?.platform !== 'youtube') return;
    try {
      const message = isPlaying
        ? '{"event":"command","func":"playVideo","args":""}'
        : '{"event":"command","func":"pauseVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
    } catch (error) {
      console.error('[Player] sync error:', error);
    }
  }, [isPlaying, currentTrack]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const input = urlInput.trim();
    const ytVideoMatch = input.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
    const ytListMatch = input.match(/[?&]list=([^&?\s]+)/);
    const rutubeMatch = input.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);
    const isVk = input.toLowerCase().includes('vk') || input.toLowerCase().includes('vkvideo');
    const vkIdMatch = input.match(/(-?\d+)_(\d+)/);

    if (ytVideoMatch || ytListMatch) {
      let trackId = '';
      if (ytVideoMatch && ytListMatch) trackId = `${ytVideoMatch[1]}&list=${ytListMatch[1]}`;
      else if (ytListMatch) trackId = `videoseries?list=${ytListMatch[1]}`;
      else if (ytVideoMatch) trackId = ytVideoMatch[1];
      setCurrentTrack({ platform: 'youtube', id: trackId, title: 'YouTube Stream' });
      setUrlInput('');
    } else if (rutubeMatch) {
      setCurrentTrack({ platform: 'rutube', id: rutubeMatch[1], title: 'RUTUBE Stream' });
      setUrlInput('');
    } else if (isVk && vkIdMatch) {
      const trackId = `${vkIdMatch[1]}_${vkIdMatch[2]}`;
      setCurrentTrack({ platform: 'vk', id: trackId, title: 'VK Video Stream' });
      setUrlInput('');
    } else {
      alert(t.player.invalidLink);
    }
  };

  const handlePlatformSearch = (platform: 'youtube' | 'rutube' | 'vk') => {
    const query = 'guitar backing track jam';
    let url = '';
    if (platform === 'youtube') url = `https://www.youtube.com/results?search_query=${query.replace(/ /g, '+')}`;
    if (platform === 'rutube') url = `https://rutube.ru/search/?query=${query.replace(/ /g, '+')}`;
    if (platform === 'vk') url = `https://vk.com/video/search?q=${query.replace(/ /g, '%20')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNext = () => {
    const next = pickNextFromSeeds(currentTrack?.platform === 'youtube' ? currentTrack.id : null);
    if (!next) return;
    setCurrentTrack({ platform: 'youtube', id: next.id, title: 'YouTube Stream' });
  };

  const getEmbedUrl = (trackId: string, platform: string = 'youtube') => {
    if (platform === 'rutube') {
      return `https://rutube.ru/play/embed/${trackId}`;
    }
    if (platform === 'vk') {
      const [oid, vid] = trackId.split('_');
      return `https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2&autoplay=${autoplay ? 1 : 0}`;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      fs: '1',
      origin: origin
    });
    if (trackId.startsWith('videoseries?')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else if (trackId.includes('&list=')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else {
      return `https://www.youtube.com/embed/${trackId}?${params.toString()}`;
    }
  };

  return (
    <div style={{
      background: 'var(--bg-panel)', width: '100%', height: playerHeight,
      display: 'flex', flexDirection: 'column',
      borderBottom: '1px solid var(--border-color)', overflow: 'hidden'
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', gap: '12px', alignItems: 'center',
        flexWrap: 'wrap',
      }}>

        {/* Platform search buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginRight: '4px' }}>{t.player.search}:</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePlatformSearch('youtube')}
            aria-label={`${t.player.searchOn} YouTube`}
            style={{ padding: '0 8px', minWidth: 0, fontSize: '11px', fontWeight: 900, background: '#FF0000', color: '#fff', borderColor: '#FF0000', borderRadius: 'var(--radius-sm)', minHeight: '28px' }}
          >
            YT
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePlatformSearch('rutube')}
            aria-label={`${t.player.searchOn} RUTUBE`}
            style={{ padding: '0 8px', minWidth: 0, fontSize: '11px', fontWeight: 900, background: '#0A1128', color: '#fff', borderColor: '#8a0a26', borderRadius: 'var(--radius-sm)', minHeight: '28px' }}
          >
            RU
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePlatformSearch('vk')}
            aria-label={`${t.player.searchOn} VK`}
            style={{ padding: '0 8px', minWidth: 0, fontSize: '11px', fontWeight: 900, background: '#0077FF', color: '#fff', borderColor: '#0077FF', borderRadius: 'var(--radius-sm)', minHeight: '28px' }}
          >
            VK
          </Button>
        </div>

        {/* URL input + controls */}
        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder={t.player.placeholder}
            className="fl-input"
            aria-label={t.player.pasteLink}
            style={{ flex: 1, minWidth: '120px', borderRadius: 'var(--radius-full)' }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={youtubeSeeds.length === 0}
            aria-label={t.player.next}
            style={{ color: youtubeSeeds.length === 0 ? 'var(--text-muted)' : 'var(--accent)', borderRadius: 'var(--radius-full)', padding: '0 14px', whiteSpace: 'nowrap' }}
          >
            {t.player.next}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            aria-label={t.player.load}
            style={{ borderRadius: 'var(--radius-full)', padding: '0 24px' }}
          >
            {t.player.load}
          </Button>
        </form>
      </div>

      {/* ── Embed area ── */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
        {currentTrack && ['youtube', 'rutube', 'vk'].includes(currentTrack.platform) ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={getEmbedUrl(currentTrack.id, currentTrack.platform)}
            title="FretLab Media Hub Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ display: 'block' }}
          />
        ) : (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-muted)', fontSize: '14px', fontWeight: 800,
            textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🎵</span>
            {t.player.awaiting}<br />
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'none', marginTop: '8px', display: 'block' }}>
              {t.player.awaitingHint}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
