import { Component, inject, signal, computed, effect } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SubtitleService } from './subtitle.service';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { DropZone } from './components/drop-zone/drop-zone';
import { LanguageControls } from './components/language-controls/language-controls';
import { SubtitleResult } from './components/subtitle-result/subtitle-result';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [ThemeToggle, DropZone, LanguageControls, SubtitleResult],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly subtitleService = inject(SubtitleService);
  private objectVideoUrl: string | null = null;

  selectedFile = signal<File | null>(null);
  sourceLanguage = signal('');
  targetLanguage = signal('en');
  burnSubtitles = signal(false);
  isProcessing = signal(false);
  isPreparingVideo = signal(false);
  srtContent = signal<string | null>(null);
  detectedLanguage = signal<string | null>(null);
  videoDownloadUrl = signal<string | null>(null);
  videoFileName = signal('video_subtitled.mp4');
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
        this.isPreparingVideo.set(false);
        this.clearVideoDownloadUrl();
        this.videoFileName.set(this.buildSubtitledFileName(this.selectedFile()!.name));
        this.errorMessage.set(null);
      }
    });
  }

  onBurnSubtitlesChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.burnSubtitles.set(Boolean(input?.checked));
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || !this.canSubmit()) return;

    this.isProcessing.set(true);
    this.isPreparingVideo.set(false);
    this.srtContent.set(null);
    this.detectedLanguage.set(null);
    this.clearVideoDownloadUrl();
    this.videoFileName.set(this.buildSubtitledFileName(file.name));
    this.errorMessage.set(null);

    const sourceLanguage = this.sourceLanguage() || undefined;

    this.subtitleService.processVideo(file, this.targetLanguage(), sourceLanguage).subscribe({
      next: (res) => {
        this.srtContent.set(res.srt_content);
        this.detectedLanguage.set(res.detected_language);
        this.setVideoDownloadUrl(
          res.video_download_url ?? res.video_url ?? res.burned_video_url ?? null,
        );

        this.isProcessing.set(false);

        if (!this.burnSubtitles()) {
          return;
        }

        if (this.videoDownloadUrl()) {
          return;
        }

        this.isPreparingVideo.set(true);

        this.subtitleService.burnVideo(file, this.targetLanguage(), sourceLanguage).subscribe({
          next: (videoRes) => {
            const objectUrl = URL.createObjectURL(videoRes.blob);
            this.setVideoDownloadUrl(objectUrl);

            if (videoRes.fileName) {
              this.videoFileName.set(videoRes.fileName);
            }

            this.isPreparingVideo.set(false);
          },
          error: (err) => {
            this.errorMessage.set(this.buildErrorMessage(err));
            this.isPreparingVideo.set(false);
          },
        });
      },
      error: (err) => {
        this.errorMessage.set(this.buildErrorMessage(err));
        this.isProcessing.set(false);
      },
    });
  }

  private setVideoDownloadUrl(url: string | null): void {
    if (this.objectVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.objectVideoUrl);
    }
    this.objectVideoUrl = url;
    this.videoDownloadUrl.set(url);
  }

  private clearVideoDownloadUrl(): void {
    this.setVideoDownloadUrl(null);
  }

  private buildErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'An unexpected error occurred.';
    }

    if (error.status === 0) {
      return `Could not reach API at ${environment.apiUrl}. Check API URL, CORS, and network.`;
    }

    const apiMessage = this.extractApiErrorMessage(error.error);
    if (apiMessage) {
      return `${apiMessage} (HTTP ${error.status})`;
    }

    const statusText = error.statusText?.trim();
    return statusText
      ? `Request failed: HTTP ${error.status} ${statusText}`
      : `Request failed: HTTP ${error.status}`;
  }

  private extractApiErrorMessage(payload: unknown): string | null {
    if (typeof payload === 'string') {
      const text = payload.trim();
      return text || null;
    }

    if (!this.isRecord(payload)) {
      return null;
    }

    const detail = payload['detail'] ?? payload['message'] ?? payload['error'];
    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (this.isRecord(item) && typeof item['msg'] === 'string') {
            return item['msg'];
          }
          return null;
        })
        .filter((part): part is string => Boolean(part));
      return parts.length ? parts.join('; ') : null;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private buildSubtitledFileName(originalName: string): string {
    const dotIndex = originalName.lastIndexOf('.');
    if (dotIndex <= 0) {
      return `${originalName}_subtitled`;
    }
    const baseName = originalName.slice(0, dotIndex);
    const extension = originalName.slice(dotIndex);
    return `${baseName}_subtitled${extension}`;
  }
}
