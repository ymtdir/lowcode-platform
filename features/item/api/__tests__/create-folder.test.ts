import { createFolder } from '../create-folder';

// createItemをモック化
jest.mock('../create-item', () => ({
  createItem: jest.fn(),
}));

import { createItem } from '../create-item';

describe('createFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createItemをtypeをFOLDERに設定して呼び出す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(createItem).toHaveBeenCalledWith(
      {},
      expect.any(FormData)
    );

    // FormDataのtypeフィールドがFOLDERに設定されていることを確認
    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('FOLDER');
    expect(calledFormData.get('name')).toBe('テストフォルダ');
    expect(calledFormData.get('parentId')).toBe('');
  });

  it('親フォルダを指定した場合も正しく渡される', async () => {
    const formData = new FormData();
    formData.append('name', '子フォルダ');
    formData.append('parentId', 'parent-1');

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });

    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('FOLDER');
    expect(calledFormData.get('name')).toBe('子フォルダ');
    expect(calledFormData.get('parentId')).toBe('parent-1');
  });

  it('typeを明示的に設定してもFOLDERで上書きされる', async () => {
    const formData = new FormData();
    formData.append('name', 'フォルダ確認');
    formData.append('parentId', '');
    formData.append('type', 'TABLE'); // 異なるtypeを設定

    (createItem as jest.Mock).mockResolvedValue({ success: true });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });

    // typeがFOLDERに上書きされていることを確認
    const calledFormData = (createItem as jest.Mock).mock.calls[0][1];
    expect(calledFormData.get('type')).toBe('FOLDER');
  });
});
