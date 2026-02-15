import { loadState } from '../storage';

describe('storage fallback safety', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('returns defaults when localStorage payload is broken JSON', () => {
    window.localStorage.setItem('hanja-study:state', '{broken-json');

    const st = loadState();

    expect(st.version).toBe(2);
    expect(st.settings.dailyCount).toBe(5);
    expect(st.streak.count).toBe(0);
    expect(st.progress).toEqual({});

    // load should not overwrite the broken payload automatically
    expect(window.localStorage.getItem('hanja-study:state')).toBe('{broken-json');
  });

  test('merges partial payload with defaults without crashing', () => {
    window.localStorage.setItem('hanja-study:state', JSON.stringify({ version: 2, settings: { dailyCount: 10 } }));

    const st = loadState();

    expect(st.version).toBe(2);
    expect(st.settings.dailyCount).toBe(10);
    expect(st.settings.lastGradeLabel).toBe('8급');
    expect(st.stats.daily).toEqual({});
  });
});
