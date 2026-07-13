import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';

interface PlayerProps {
  height?: string | number;
  autoplay?: boolean;
}

const Player: React.FC<PlayerProps> = ({ 
  height = '420px', 
  autoplay = true 
}) => {
  const { currentTrack, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [urlInput, setUrlInput] = useState('');

  // Состояния для кастомной панели управления
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  // 1. ПОЛУЧЕНИЕ ДАННЫХ О ВРЕМЕНИ ОТ YOUTUBE
  useEffect(() => {
    if (currentTrack?.platform !== 'youtube') return;
    
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        const message = JSON.stringify({ event: "command", func: "getCurrentTime", args: [] });
        iframeRef.current.contentWindow.postMessage(message, '*');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentTrack]);

  // 2. ОБРАБОТКА ОТВЕТОВ ОТ YOUTUBE
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'infoDelivery' && data.info) {
            if (data.info.currentTime) setCurrentTime(data.info.currentTime);
            if (data.info.duration) setDuration(data.info.duration);
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
          }
        } catch (e) {
          // Игнорируем не-JSON сообщения
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 3. ФУНКЦИИ УПРАВЛЕНИЯ ПЛЕЕРОМ ЧЕРЕЗ postMessage
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow && currentTrack?.platform === 'youtube') {
      const message = JSON.stringify({ event: "command", func: func, args: args });
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      sendCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendCommand("playVideo");
      setIsPlaying(true);
    }
  };

  const handleNext = () => sendCommand("nextVideo");
  const handlePrev = () => sendCommand("previousVideo");
  const handleMute = () => sendCommand("mute");

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    sendCommand("seekTo", [time, true]);
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    sendCommand("setVolume", [vol]);
    if (vol > 0) sendCommand("unMute");
  };

  // 4. ПАРСЕР ССЫЛОК И ПОИСК (Оставляем как было)
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
    } 
    else if (rutubeMatch) {
      setCurrentTrack({ platform: 'rutube', id: rutubeMatch[1], title: 'RUTUBE Stream' });
      setUrlInput('');
    } 
    else if (isVk && vkIdMatch) {
      setCurrentTrack({ platform: 'vk', id: `${vkIdMatch[1]}_${vkIdMatch[2]}`, title: 'VK Video Stream' });
      setUrlInput('');
    } 
    else {
      alert("Invalid link! Please paste a valid link from YouTube, RUTUBE, or VK Video.");
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

  const getEmbedUrl = (trackId: string, platform: string = 'youtube') => {
    if (platform === 'rutube') return `https://rutube.ru/play/embed/${trackId}`;
    if (platform === 'vk') {
      const [oid, vid] = trackId.split('_');
      return `https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2&autoplay=${autoplay ? 1 : 0}`;
    }
    
    // YouTube параметры: скрываем нативные контролы (controls=0), чтобы использовать наши
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      enablejsapi: '1', 
      autoplay: autoplay ? '1' : '0', 
      controls: '0', // 🔥 Скрываем нативный UI Ютуба!
      rel: '0', // Скрываем рекомендации при паузе
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

  // Утилита форматирования времени (секунды -> мм:сс)
  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ background: 'var(--bg-panel)', width: '100%', height: height, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
      
      {/* ПАНЕЛЬ ЗАГРУЗКИ ССЫЛОК */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginRight: '4px' }}>SEARCH:</span>
          <button type="button" onClick={() => handlePlatformSearch('youtube')} title="Search on YouTube" style={{ width: '24px', height: '24px', background: '#FF0000', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }}>YT</button>
          <button type="button" onClick={() => handlePlatformSearch('rutube')} title="Search on RUTUBE" style={{ width: '24px', height: '24px', background: '#0A1128', color: '#FFF', border: '1px solid #00D9F5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }}>RU</button>
          <button type="button" onClick={() => handlePlatformSearch('vk')} title="Search on VK Video" style={{ width: '24px', height: '24px', background: '#0077FF', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }}>VK</button>
        </div>

        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="🔗 Paste YouTube, RUTUBE, or VK Video link here..." style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', outline: 'none' }} />
          <button type="submit" style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '20px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>LOAD</button>
        </form>
      </div>

      {/* 📺 ОКНО ВИДЕОПЛЕЕРА */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
        {currentTrack ? (
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
          <div aria-label="No track selected" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 800, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🎵</span>
            Awaiting Media Stream<br/>
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'none', marginTop: '8px', display: 'block' }}>Search a platform or paste any link</span>
          </div>
        )}
      </div>

      {/* 🎛 КАСТОМНАЯ ПАНЕЛЬ УПРАВЛЕНИЯ (Только для YouTube) */}
      {currentTrack?.platform === 'youtube' && (
        <div style={{ padding: '12px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Прогресс-бар */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, minWidth: '35px' }}>{formatTime(currentTime)}</span>
            <input 
              type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
              style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px', outline: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, minWidth: '35px' }}>{formatTime(duration)}</span>
          </div>

          {/* Кнопки управления */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <button onClick={handlePrev} title="Previous Track" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px', padding: '8px', borderRadius: '50%', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              ⏮
            </button>
            
            <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"} style={{ background: 'var(--accent)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '18px', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: isPlaying ? '0 0 12px rgba(0,255,157,0.4)' : 'none' }}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button onClick={handleNext} title="Next Track" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px', padding: '8px', borderRadius: '50%', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              ⏭
            </button>

            {/* Блок громкости */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
              <button onClick={handleMute} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>
                🔊
              </button>
              <input 
                type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                style={{ width: '80px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', outline: 'none', cursor: 'pointer' }}
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Player;