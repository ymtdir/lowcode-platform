import { validateColumnValue } from '../validate-column-value';
import type {
  SelectColumn,
  MultiSelectColumn,
  TextColumn,
  NumberColumn,
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

  describe('NUMBER型のバリデーション', () => {
    const numberColumn: NumberColumn = {
      id: 'col-1',
      name: '金額',
      type: 'NUMBER',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('有効な数値はバリデーションを通過する', () => {
      const result = validateColumnValue(100, numberColumn);
      expect(result).toBeNull();
    });

    it('min値未満の場合はエラーを返す', () => {
      const columnWithMin: NumberColumn = {
        ...numberColumn,
        config: { min: 0 },
      };
      const result = validateColumnValue(-10, columnWithMin);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: '金額',
        message: '金額は0以上である必要があります',
      });
    });

    it('max値超過の場合はエラーを返す', () => {
      const columnWithMax: NumberColumn = {
        ...numberColumn,
        config: { max: 100 },
      };
      const result = validateColumnValue(200, columnWithMax);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: '金額',
        message: '金額は100以下である必要があります',
      });
    });

    it('required=trueで空値の場合はエラーを返す', () => {
      const requiredColumn: NumberColumn = {
        ...numberColumn,
        validation: { required: true },
      };
      const result = validateColumnValue(null, requiredColumn);
      expect(result).toEqual({
        columnId: 'col-1',
        columnName: '金額',
        message: '金額は必須項目です',
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
