import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubtitleService } from './subtitle.service';

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
];

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly subtitleService = inject(SubtitleService);

  readonly languages = LANGUAGES;

  selectedFile = signal<File | null>(null);
  sourceLanguage = '';
  targetLanguage = 'en';
  isDragging = signal(false);
  isProcessing = signal(false);
  srtContent = signal<string | null>(null);
  detectedLanguage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  readonly canSubmit = computed(
    () => !!this.selectedFile() && !!this.targetLanguage && !this.isProcessing(),
  );

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.setFile(file);
    }
  }

  private setFile(file: File): void {
    this.selectedFile.set(file);
    this.srtContent.set(null);
    this.detectedLanguage.set(null);
    this.errorMessage.set(null);
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || !this.canSubmit()) return;

    this.isProcessing.set(true);
    this.srtContent.set(null);
    this.detectedLanguage.set(null);
    this.errorMessage.set(null);

    this.subtitleService
      .processVideo(file, this.targetLanguage, this.sourceLanguage || undefined)
      .subscribe({
        next: (res) => {
          this.srtContent.set(res.srt_content);
          this.detectedLanguage.set(res.detected_language);
          this.isProcessing.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.detail ?? 'An unexpected error occurred. Is the API running?',
          );
          this.isProcessing.set(false);
        },
      });
  }

  downloadSrt(): void {
    const content = this.srtContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  }

  get selectedFileName(): string {
    return this.selectedFile()?.name ?? '';
  }

  get detectedLanguageName(): string {
    const code = this.detectedLanguage();
    if (!code) return '';
    return LANGUAGES.find((l) => l.code === code)?.name ?? code;
  }
}
