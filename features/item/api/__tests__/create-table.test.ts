import { createTable } from '../create-table';

// createItemをモック化
jest.mock('../create-item', () => ({
  createItem: jest.fn(),
}));

import { createItem } from '../create-item';

describe('createTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createItemをtypeをTABLEに設定して呼び出す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストテーブル');
    formData.append('parentId', '');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    expect(createItem).toHaveBeenCalledWith(
      {},
      expect.any(FormData)
    );

    // FormDataのtypeフィールドがTABLEに設定されていることを確認
    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('TABLE');
    expect(calledFormData.get('name')).toBe('テストテーブル');
    expect(calledFormData.get('parentId')).toBe('');
  });

  it('親フォルダを指定した場合も正しく渡される', async () => {
    const formData = new FormData();
    formData.append('name', '子テーブル');
    formData.append('parentId', 'parent-1');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });

    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('TABLE');
    expect(calledFormData.get('name')).toBe('子テーブル');
    expect(calledFormData.get('parentId')).toBe('parent-1');
  });

  it('typeを明示的に設定してもTABLEで上書きされる', async () => {
    const formData = new FormData();
    formData.append('name', 'テーブル確認');
    formData.append('parentId', '');
    formData.append('type', 'FOLDER'); // 異なるtypeを設定

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });

    // typeがTABLEに上書きされていることを確認
    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('TABLE');
  });
});
