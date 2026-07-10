import { type TrackInfo } from '../context/MusicContext';

// Типы действий, которые ИИ может попросить интерфейс выполнить
export interface AIAction {
  type: 'SET_CONTEXT';
  payload: {
    key?: string;
    mode?: any;
    track?: TrackInfo;
  };
}

export interface AIResponse {
  text: string;
  action?: AIAction;
}

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  // Эмулируем задержку сети
  await new Promise(resolve => setTimeout(resolve, 800));

  const lowerQuery = query.toLowerCase();

  // Сценарий 1: Просьба включить джем в Ля миноре
  if ((lowerQuery.includes('джем') || lowerQuery.includes('минус')) && (lowerQuery.includes('ля минор') || lowerQuery.includes('am'))) {
    return {
      text: "Отличный выбор! Я нашел атмосферный блюз/фанк минус в Ля миноре (A Aeolian) на YouTube. Я уже перестроил гриф и аккорды под эту тональность. Удачного джема!",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'A',
          mode: 'aeolian',
          track: { platform: 'youtube', id: 'OebA4GfO8wU', title: 'Slow Blues/Funk Backing Track (Am)' }
        }
      }
    };
  }

  // Сценарий 2: Rutube или VK
  if (lowerQuery.includes('rutube')) {
    return {
      text: "Подключаю RUTUBE. Вот отличный фьюжн-джем в Ми миноре.",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'E',
          mode: 'dorian',
          track: { platform: 'rutube', id: '1a2b3c4d5e', title: 'Fusion Jam (RUTUBE Mock)' } // заглушка ID
        }
      }
    };
  }

  // Сценарий по умолчанию (Чат)
  return {
    text: "Я пока учусь понимать все запросы. Попробуй попросить меня: 'Найди джем в ля миноре', и я автоматически настрою приложение!"
  };
};