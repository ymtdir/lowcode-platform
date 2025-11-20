'use server';

import { createItem } from './create-item';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * テーブルを作成するServer Action（createItemのラッパー）
 */
export async function createTable(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // type を TABLE に固定
  const newFormData = new FormData();
  newFormData.set('name', formData.get('name') as string);
  newFormData.set('parentId', formData.get('parentId') as string);
  newFormData.set('type', 'TABLE');

  return createItem(prevState, newFormData);
}
