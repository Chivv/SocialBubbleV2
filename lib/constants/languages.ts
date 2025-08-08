export const languages = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch (Nederlands)' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'it', label: 'Italian (Italiano)' },
  { value: 'pt', label: 'Portuguese (Português)' },
  { value: 'other', label: 'Other' }
].sort((a, b) => a.label.localeCompare(b.label));

export function getLanguageLabel(code: string): string {
  const language = languages.find(lang => lang.value === code);
  return language ? language.label : code;
}