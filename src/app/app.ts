import { Component, inject, signal, computed, effect } from '@angular/core';
import { SubtitleService } from './subtitle.service';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { DropZone } from './components/drop-zone/drop-zone';
import { LanguageControls } from './components/language-controls/language-controls';
import { SubtitleResult } from './components/subtitle-result/subtitle-result';

@Component({
  selector: 'app-root',
  imports: [ThemeToggle, DropZone, LanguageControls, SubtitleResult],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly subtitleService = inject(SubtitleService);

  selectedFile = signal<File | null>(null);
  sourceLanguage = signal('');
  targetLanguage = signal('en');
  isProcessing = signal(false);
  srtContent = signal<string | null>(null);
  detectedLanguage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  readonly canSubmit = computed(
    () => !!this.selectedFile() && !!this.targetLanguage() && !this.isProcessing(),
  );

  constructor() {
    // Reset results whenever a new file is chosen.
    effect(() => {
      if (this.selectedFile()) {
        this.srtContent.set(null);
        this.detectedLanguage.set(null);
        this.errorMessage.set(null);
      }
    });
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || !this.canSubmit()) return;

    this.isProcessing.set(true);
    this.srtContent.set(null);
    this.detectedLanguage.set(null);
    this.errorMessage.set(null);

    this.subtitleService
      .processVideo(file, this.targetLanguage(), this.sourceLanguage() || undefined)
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
}
