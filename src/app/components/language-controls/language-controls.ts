import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LANGUAGES, Language } from '../../languages';

@Component({
  selector: 'app-language-controls',
  imports: [FormsModule],
  templateUrl: './language-controls.html',
  styleUrl: './language-controls.css',
})
export class LanguageControls {
  readonly sourceLanguage = model('');
  readonly targetLanguage = model('en');

  readonly languages: Language[] = LANGUAGES;
}
