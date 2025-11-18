import { createFolder } from '../create-folder';
import { createItem } from '../create-item';

// createItemをモック化
jest.mock('../create-item', () => ({
  createItem: jest.fn(),
}));

describe('createFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createItemをtype=FOLDERで呼び出す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', 'parent-1');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(createItem).toHaveBeenCalledTimes(1);

    // createItemが正しい引数で呼び出されたか確認
    const callArgs = (createItem as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toEqual({}); // prevState
    expect(callArgs[1]).toBeInstanceOf(FormData);

    // FormDataの内容を確認
    const passedFormData = callArgs[1] as FormData;
    expect(passedFormData.get('name')).toBe('テストフォルダ');
    expect(passedFormData.get('parentId')).toBe('parent-1');
    expect(passedFormData.get('type')).toBe('FOLDER');
  });

  it('parentIdが空文字列の場合も正しく処理する', async () => {
    const formData = new FormData();
    formData.append('name', 'ルートフォルダ');
    formData.append('parentId', '');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(createItem).toHaveBeenCalledTimes(1);

    const callArgs = (createItem as jest.Mock).mock.calls[0];
    const passedFormData = callArgs[1] as FormData;
    expect(passedFormData.get('name')).toBe('ルートフォルダ');
    expect(passedFormData.get('parentId')).toBe('');
    expect(passedFormData.get('type')).toBe('FOLDER');
  });

  it('createItemがエラーを返した場合はそのエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    (createItem as jest.Mock).mockResolvedValue({
      error: 'アイテムの作成に失敗しました',
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({
      error: 'アイテムの作成に失敗しました',
    });
    expect(createItem).toHaveBeenCalledTimes(1);
  });

  it('prevStateを正しく渡す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    const prevState = { error: '前のエラー' };

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    await createFolder(prevState, formData);

    const callArgs = (createItem as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toEqual(prevState);
  });
});
