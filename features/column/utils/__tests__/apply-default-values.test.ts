import { applyDefaultValues } from '../apply-default-values';
import type {
  SelectColumn,
  TextColumn,
  NumberColumn,
} from '../../types/column';

describe('applyDefaultValues', () => {
  it('SELECT型のデフォルト値を適用する', () => {
    const columns: SelectColumn[] = [
      {
        id: 'col-1',
        name: 'ステータス',
        type: 'SELECT',
        order: 0,
        config: {
          options: [
            { id: 'opt-1', label: '未着手' },
            { id: 'opt-2', label: '進行中' },
          ],
          defaultValue: 'opt-1',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({
      'col-1': 'opt-1',
    });
  });

  it('SELECT型（複数選択）のデフォルト値を適用する', () => {
    const columns: SelectColumn[] = [
      {
        id: 'col-1',
        name: 'タグ',
        type: 'SELECT',
        order: 0,
        config: {
          options: [
            { id: 'opt-1', label: 'タグ1' },
            { id: 'opt-2', label: 'タグ2' },
          ],
          allowMultiple: true,
          defaultValue: ['opt-1', 'opt-2'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({
      'col-1': ['opt-1', 'opt-2'],
    });
  });

  it('デフォルト値がないSELECT型は値を設定しない', () => {
    const columns: SelectColumn[] = [
      {
        id: 'col-1',
        name: 'ステータス',
        type: 'SELECT',
        order: 0,
        config: {
          options: [
            { id: 'opt-1', label: '未着手' },
            { id: 'opt-2', label: '進行中' },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({});
  });

  it('TEXT型など他のカラムタイプは値を設定しない', () => {
    const columns: TextColumn[] = [
      {
        id: 'col-1',
        name: '顧客名',
        type: 'TEXT',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({});
  });

  it('複数のカラムがある場合、デフォルト値があるものだけ適用する', () => {
    const columns = [
      {
        id: 'col-1',
        name: '顧客名',
        type: 'TEXT' as const,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'col-2',
        name: 'ステータス',
        type: 'SELECT' as const,
        order: 1,
        config: {
          options: [
            { id: 'opt-1', label: '未着手' },
            { id: 'opt-2', label: '進行中' },
          ],
          defaultValue: 'opt-1',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'col-3',
        name: 'タグ',
        type: 'SELECT' as const,
        order: 2,
        config: {
          options: [
            { id: 'tag-1', label: 'タグ1' },
            { id: 'tag-2', label: 'タグ2' },
          ],
          allowMultiple: true,
          defaultValue: ['tag-1'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({
      'col-2': 'opt-1',
      'col-3': ['tag-1'],
    });
  });

  it('空のカラム配列の場合は空オブジェクトを返す', () => {
    const result = applyDefaultValues([]);

    expect(result).toEqual({});
  });

  it('NUMBER型のデフォルト値を適用する', () => {
    const columns: NumberColumn[] = [
      {
        id: 'col-1',
        name: '金額',
        type: 'NUMBER',
        order: 0,
        config: {
          defaultValue: 100,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({
      'col-1': 100,
    });
  });

  it('デフォルト値がないNUMBER型は値を設定しない', () => {
    const columns: NumberColumn[] = [
      {
        id: 'col-1',
        name: '金額',
        type: 'NUMBER',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({});
  });

  it('NUMBER型のデフォルト値が0の場合も適用する', () => {
    const columns: NumberColumn[] = [
      {
        id: 'col-1',
        name: '金額',
        type: 'NUMBER',
        order: 0,
        config: {
          defaultValue: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = applyDefaultValues(columns);

    expect(result).toEqual({
      'col-1': 0,
    });
  });
});
