import { checkRateLimit } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('制限以内のリクエストはallowed: trueを返す', () => {
    const result = checkRateLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
  });

  it('制限を超えたリクエストはallowed: falseを返す', () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user-2');
    }

    const result = checkRateLimit('user-2');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('ウィンドウがリセットされるとカウントがリセットされる', () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user-3');
    }

    expect(checkRateLimit('user-3').allowed).toBe(false);

    // 1分経過
    jest.advanceTimersByTime(60 * 1000);

    const result = checkRateLimit('user-3');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('異なるユーザーは独立してカウントされる', () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user-4');
    }

    expect(checkRateLimit('user-4').allowed).toBe(false);
    expect(checkRateLimit('user-5').allowed).toBe(true);
  });
});
