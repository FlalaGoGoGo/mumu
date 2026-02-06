import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n/translations';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSelector({ variant = 'default', className = '' }: LanguageSelectorProps) {
  // Top-right selector uses temporary (session-only) language change
  const { language, setLanguage } = useLanguage();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger 
        className={`${variant === 'compact' ? 'w-auto' : 'w-[180px]'} min-h-[44px] px-4 gap-2 bg-background ${className}`}
      >
        <SelectValue className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            <span>{currentLang?.flag}</span>
            <span>{currentLang?.nativeLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.nativeLabel}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
