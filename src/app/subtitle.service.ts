import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ProcessResponse {
  status: string;
  detected_language: string;
  srt_content: string;
  burn_subtitles?: boolean;
  video_url?: string;
  video_download_url?: string;
  burned_video_url?: string;
}

export interface BurnVideoResponse {
  blob: Blob;
  fileName: string | null;
}

@Injectable({ providedIn: 'root' })
export class SubtitleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  processVideo(
    file: File,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Observable<ProcessResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('target_language', targetLanguage);
    if (sourceLanguage) {
      form.append('source_language', sourceLanguage);
    }
    form.append('burn_subtitles', 'false');
    return this.http.post<ProcessResponse>(`${this.apiUrl}/process`, form);
  }

  burnVideo(
    file: File,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Observable<BurnVideoResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('target_language', targetLanguage);
    if (sourceLanguage) {
      form.append('source_language', sourceLanguage);
    }
    form.append('burn_subtitles', 'true');

    return this.http
      .post(`${this.apiUrl}/process`, form, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => ({
          blob: response.body ?? new Blob(),
          fileName: this.extractFilename(response.headers.get('content-disposition')),
        })),
      );
  }

  private extractFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return plainMatch?.[1] ?? null;
  }
}
