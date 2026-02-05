import { Globe } from 'lucide-react';
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
  const { language, setLanguage } = useLanguage();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger 
        className={`${variant === 'compact' ? 'w-auto gap-1.5 px-2' : 'w-[180px]'} bg-background ${className}`}
      >
        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <SelectValue>
          {currentLang?.flag} {currentLang?.nativeLabel}
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
