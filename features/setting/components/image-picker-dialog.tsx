'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Check, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImage, getImages, deleteImage } from '@/features/upload/api';
import type { ImageFile } from '@/features/upload/api';
import Image from 'next/image';

/**
 * 画像選択ダイアログのProps型
 */
type ImagePickerDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (path: string | null) => void;
  currentPath?: string;
  imageType?: 'icon' | 'favicon';
};

/**
 * アップロード状態
 */
type UploadState =
  | { type: 'idle' }
  | { type: 'uploading' }
  | { type: 'success'; path: string }
  | { type: 'error'; message: string };

/**
 * 画像選択ダイアログコンポーネント
 */
export function ImagePickerDialog({
  open,
  onOpenChange,
  onSelect,
  currentPath,
  imageType,
}: ImagePickerDialogProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ type: 'idle' });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null | undefined>(
    currentPath
  );
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // 画像一覧を読み込む
  const loadImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const imageFiles = await getImages(imageType);
      setImages(imageFiles);
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
    } finally {
      setIsLoadingImages(false);
    }
  }, [imageType]);

  // ダイアログが開いたら画像一覧を読み込む
  useEffect(() => {
    if (open) {
      loadImages();
      setSelectedPath(currentPath);
    }
  }, [open, currentPath, loadImages]);

  // ファイルドロップハンドラー
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadState({ type: 'uploading' });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadImage(formData, imageType);

        if (result.success && result.path) {
          setUploadState({ type: 'success', path: result.path });
          setSelectedPath(result.path);
          // 画像一覧を再読み込み
          await loadImages();
        } else {
          setUploadState({
            type: 'error',
            message: result.error || 'アップロードに失敗しました',
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setUploadState({
          type: 'error',
          message: 'アップロード中にエラーが発生しました',
        });
      }
    },
    [loadImages, imageType]
  );

  // ファイル拒否ハンドラー
  const onDropRejected = useCallback(() => {
    setUploadState({
      type: 'error',
      message: '画像ファイルを選択してください',
    });
  }, []);

  // react-dropzone設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
      'image/x-icon': ['.ico'],
      'image/vnd.microsoft.icon': ['.ico'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB制限
    multiple: false,
  });

  // 選択確定ハンドラー
  const handleConfirm = useCallback(() => {
    if (onSelect) {
      onSelect(selectedPath ?? null);
      onOpenChange?.(false);
    }
  }, [selectedPath, onSelect, onOpenChange]);

  // 選択クリアハンドラー
  const handleClear = useCallback(() => {
    setSelectedPath(null);
    if (onSelect) {
      onSelect(null);
      onOpenChange?.(false);
    }
  }, [onSelect, onOpenChange]);

  // 画像削除ハンドラー
  const handleDelete = useCallback(
    async (imagePath: string, event: React.MouseEvent) => {
      event.stopPropagation(); // 親要素のクリックイベントを防ぐ

      try {
        const result = await deleteImage(imagePath);
        if (result.success) {
          // 削除した画像が選択中だった場合、選択を解除
          if (selectedPath === imagePath) {
            setSelectedPath(null);
          }
          // 画像一覧を再読み込み
          await loadImages();
        } else {
          alert(result.error || '画像の削除に失敗しました');
        }
      } catch (error) {
        console.error('画像の削除に失敗しました:', error);
        alert('画像の削除中にエラーが発生しました');
      }
    },
    [selectedPath, loadImages]
  );

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>画像を選択</DialogTitle>
          <DialogDescription>
            新しい画像をアップロードするか、既存の画像を選択してください
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">アップロード</TabsTrigger>
            <TabsTrigger value="gallery">ギャラリー</TabsTrigger>
          </TabsList>

          {/* アップロードタブ */}
          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isDragActive ? (
                  <Upload className="w-12 h-12 mb-4 text-primary animate-bounce" />
                ) : (
                  <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                )}
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">
                    {isDragActive
                      ? 'ここにドロップ'
                      : 'クリックまたはドラッグ&ドロップ'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG、PNG、GIF、WebP、SVG、ICO（最大5MB）
                </p>
              </div>
            </div>

            {uploadState.type === 'uploading' && (
              <Alert>
                <AlertDescription>アップロード中...</AlertDescription>
              </Alert>
            )}

            {uploadState.type === 'success' && (
              <Alert>
                <AlertDescription>
                  アップロードが完了しました: {uploadState.path}
                </AlertDescription>
              </Alert>
            )}

            {uploadState.type === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>{uploadState.message}</AlertDescription>
              </Alert>
            )}

            {selectedPath && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-white shrink-0">
                    {selectedPath.endsWith('.ico') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPath}
                        alt="Selected"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image
                        src={selectedPath}
                        alt="Selected"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedPath?.split('/').pop()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleConfirm}>この画像を使用</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ギャラリータブ */}
          <TabsContent value="gallery" className="space-y-4">
            {isLoadingImages ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  アップロードされた画像がありません
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="[&>div[data-radix-scroll-area-viewport]]:max-h-[400px] px-6">
                  <div className="space-y-2">
                    {images.map((image) => (
                      <div
                        key={image.path}
                        className="flex items-center gap-2 p-2 bg-background border rounded-lg"
                      >
                        {/* 画像サムネイル */}
                        <button
                          type="button"
                          onClick={() => setSelectedPath(image.path)}
                          className="relative w-10 h-10 rounded overflow-hidden bg-white border shrink-0 hover:scale-105 transition-transform"
                        >
                          {image.path.endsWith('.ico') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image.path}
                              alt={image.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Image
                              src={image.path}
                              alt={image.name}
                              fill
                              className="object-contain"
                            />
                          )}
                        </button>

                        {/* ファイル情報 */}
                        <button
                          type="button"
                          onClick={() => setSelectedPath(image.path)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-medium truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </p>
                        </button>

                        {/* 選択インジケーター */}
                        {selectedPath === image.path && (
                          <div className="shrink-0">
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="size-4" />
                            </div>
                          </div>
                        )}

                        {/* 削除ボタン */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(image.path, e)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedPath && (
                  <div className="flex justify-end">
                    <Button onClick={handleConfirm}>この画像を使用</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
