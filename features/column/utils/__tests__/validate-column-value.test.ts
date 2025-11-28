import { validateColumnValue } from '../validate-column-value';
import type {
  SelectColumn,
  MultiSelectColumn,
  TextColumn,
} from '../../types/column';

describe('validateColumnValue', () => {
  describe('SELECT型のバリデーション', () => {
    const selectColumn: SelectColumn = {
      id: 'col-1',
      name: 'ステータス',
      type: 'SELECT',
      order: 0,
      config: {
        options: [
          { id: 'opt-1', label: '未着手' },
          { id: 'opt-2', label: '進行中' },
          { id: 'opt-3', label: '完了' },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('有効な選択肢のIDはバリデーションを通過する', () => {
      const result = validateColumnValue('opt-1', selectColumn);
      expect(result).toBeNull();
    });

    it('無効な選択肢はエラーを返す', () => {
      const result = validateColumnValue('invalid', selectColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'ステータス',
        message: 'ステータスは有効な選択肢から選んでください',
      });
    });

    it('required=trueで空値の場合はエラーを返す', () => {
      const requiredColumn: SelectColumn = {
        ...selectColumn,
        validation: { required: true },
      };
      const result = validateColumnValue('', requiredColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'ステータス',
        message: 'ステータスは必須項目です',
      });
    });

    it('文字列以外の値はエラーを返す', () => {
      const result = validateColumnValue(123, selectColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'ステータス',
        message: 'ステータスは文字列である必要があります',
      });
    });
  });

  describe('MULTI_SELECT型のバリデーション', () => {
    const multiSelectColumn: MultiSelectColumn = {
      id: 'col-1',
      name: 'タグ',
      type: 'MULTI_SELECT',
      order: 0,
      config: {
        options: [
          { id: 'opt-1', label: 'タグ1' },
          { id: 'opt-2', label: 'タグ2' },
          { id: 'opt-3', label: 'タグ3' },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('有効な選択肢のIDの配列はバリデーションを通過する', () => {
      const result = validateColumnValue(['opt-1', 'opt-2'], multiSelectColumn);
      expect(result).toBeNull();
    });

    it('空配列はバリデーションを通過する', () => {
      const result = validateColumnValue([], multiSelectColumn);
      expect(result).toBeNull();
    });

    it('無効な選択肢を含む配列はエラーを返す', () => {
      const result = validateColumnValue(
        ['opt-1', 'invalid'],
        multiSelectColumn
      );
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'タグ',
        message: 'タグは有効な選択肢から選んでください',
      });
    });

    it('required=trueで空配列の場合はエラーを返す', () => {
      const requiredColumn: MultiSelectColumn = {
        ...multiSelectColumn,
        validation: { required: true },
      };
      const result = validateColumnValue([], requiredColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'タグ',
        message: 'タグは必須項目です',
      });
    });

    it('配列以外の値はエラーを返す', () => {
      const result = validateColumnValue('string', multiSelectColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: 'タグ',
        message: 'タグは配列である必要があります',
      });
    });
  });

  describe('その他のカラムタイプのバリデーション', () => {
    it('TEXT型の基本的なバリデーション', () => {
      const textColumn: TextColumn = {
        id: 'col-1',
        name: '顧客名',
        type: 'TEXT',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateColumnValue('テスト', textColumn);
      expect(result).toBeNull();
    });

    it('TEXT型でmaxLengthを超える場合はエラー', () => {
      const textColumn: TextColumn = {
        id: 'col-1',
        name: '顧客名',
        type: 'TEXT',
        order: 0,
        config: {
          maxLength: 5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateColumnValue('あいうえおかきくけこ', textColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: '顧客名',
        message: '顧客名は5文字以内で入力してください',
      });
    });
  });
});
