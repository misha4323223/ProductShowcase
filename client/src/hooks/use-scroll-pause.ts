import { useEffect } from 'react';

/**
 * ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
 * 
 * Этот хук автоматически приостанавливает тяжелые CSS-анимации во время скролла,
 * что значительно улучшает плавность прокрутки.
 * 
 * Как это работает:
 * 1. При скролле добавляет класс 'is-scrolling' к body
 * 2. CSS правила автоматически отключают анимации для body.is-scrolling
 * 3. Через 150ms после окончания скролла убирает класс и анимации возобновляются
 */
export function useScrollPause() {
  useEffect(() => {
    let scrollTimer: number | undefined;

    const handleScroll = () => {
      // Добавляем класс при начале скролла
      document.body.classList.add('is-scrolling');

      // Очищаем предыдущий таймер
      if (scrollTimer !== undefined) {
        window.clearTimeout(scrollTimer);
      }

      // Убираем класс через 150ms после окончания скролла
      scrollTimer = window.setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150);
    };

    // Добавляем слушатель с passive: true для лучшей производительности
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer !== undefined) {
        window.clearTimeout(scrollTimer);
      }
    };
  }, []);
}
