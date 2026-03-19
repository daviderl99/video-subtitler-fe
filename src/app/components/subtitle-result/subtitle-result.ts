import { Component, input } from '@angular/core';
import { LANGUAGES } from '../../languages';

@Component({
  selector: 'app-subtitle-result',
  templateUrl: './subtitle-result.html',
  styleUrl: './subtitle-result.css',
})
export class SubtitleResult {
  readonly srtContent = input.required<string>();
  readonly detectedLanguage = input<string | null>(null);
  readonly showVideoDownload = input(false);
  readonly videoDownloadUrl = input<string | null>(null);
  readonly videoFileName = input('video_subtitled.mp4');
  readonly videoPending = input(false);

  get detectedLanguageName(): string {
    const code = this.detectedLanguage();
    if (!code) return '';
    return LANGUAGES.find((l) => l.code === code)?.name ?? code;
  }

  download(): void {
    const content = this.srtContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadVideo(): void {
    const url = this.videoDownloadUrl();
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = this.videoFileName();
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  }
}
