import { StyleEditor, type Style } from '@/features/style';

/**
 * スタイル（CSS）設定コンテンツのProps型
 */
type StyleContentProps = {
  itemId: string;
  initialStyles: Style[];
};

/**
 * スタイル設定タブのコンテンツ
 */
export function StyleContent({ itemId, initialStyles }: StyleContentProps) {
  return <StyleEditor itemId={itemId} initialStyles={initialStyles} />;
}
