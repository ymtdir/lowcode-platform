'use server';

import { createItem } from './create-item';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createFolder(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // type を FOLDER に固定
  const newFormData = new FormData();
  newFormData.set('name', formData.get('name') as string);
  newFormData.set('parentId', formData.get('parentId') as string);
  newFormData.set('type', 'FOLDER');

  return createItem(prevState, newFormData);
}
