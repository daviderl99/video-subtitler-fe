import { Component, model, signal } from '@angular/core';

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.html',
  styleUrl: './drop-zone.css',
})
export class DropZone {
  /** Two-way bound to the parent's selected file signal. */
  readonly file = model<File | null>(null);

  readonly isDragging = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.file.set(input.files[0]);
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
    const picked = event.dataTransfer?.files[0];
    if (picked) {
      this.file.set(picked);
    }
  }

  get fileName(): string {
    return this.file()?.name ?? '';
  }
}
