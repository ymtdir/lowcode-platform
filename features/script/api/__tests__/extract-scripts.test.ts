import { extractScripts } from '../extract-scripts';

describe('extractScripts', () => {
  it('成功結果からscripts配列を取り出せる', () => {
    const result = {
      success: true as const,
      scripts: [
        {
          id: 'script-1',
          name: 'test.js',
          content: 'console.log("test")',
          order: 0,
        },
        {
          id: 'script-2',
          name: 'main.js',
          content: 'console.log("main")',
          order: 1,
        },
      ],
    };

    const scripts = extractScripts(result);

    expect(scripts).toEqual([
      {
        id: 'script-1',
        name: 'test.js',
        content: 'console.log("test")',
        order: 0,
      },
      {
        id: 'script-2',
        name: 'main.js',
        content: 'console.log("main")',
        order: 1,
      },
    ]);
  });

  it('空のscripts配列の場合は空配列を返す', () => {
    const result = {
      success: true as const,
      scripts: [],
    };

    const scripts = extractScripts(result);

    expect(scripts).toEqual([]);
  });

  it('エラー結果の場合は空配列を返す', () => {
    const result = {
      error: 'スクリプトの取得に失敗しました',
      scripts: [],
    };

    const scripts = extractScripts(result);

    expect(scripts).toEqual([]);
  });

  it('success: falseの場合は空配列を返す', () => {
    const result = {
      success: false as const,
      scripts: [{ id: 'script-1', name: 'test.js', content: '', order: 0 }],
    };

    // success: false のケースは型的にはないが、念のため
    const scripts = extractScripts(result as never);

    expect(scripts).toEqual([]);
  });
});
