import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';

export type ExportFile = { name: string; content: string; mimeType: string };

/**
 * Hands files to the person: a download on the web, the system share sheet on phones and
 * tablets (save to Files, send by e-mail, Drive…).
 */
export async function shareFiles(files: ExportFile[]): Promise<void> {
  if (Platform.OS === 'web') {
    for (const f of files) {
      const url = URL.createObjectURL(new Blob([f.content], { type: f.mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = f.name;
      link.click();
      URL.revokeObjectURL(url);
    }
    return;
  }
  if (!(await isAvailableAsync())) throw new Error('Compartilhar não está disponível aqui.');
  for (const f of files) {
    const file = new File(Paths.cache, f.name);
    file.create({ overwrite: true });
    await file.write(f.content);
    await shareAsync(file.uri, { mimeType: f.mimeType, dialogTitle: f.name });
  }
}
