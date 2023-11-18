export interface ErrorTemplateContext {
  title: string;
  contentParagraphs: Array<string>;
  errorLabel?: string;
  errorIdentifier?: string;
  fullError?: string;
}

interface TranslatedErrorTemplateContexts {
  [language: string]: {
    genericError: ErrorTemplateContext;
    notFound: ErrorTemplateContext;
  };
}

const CATCH_ALL = {
  title: 'An error was encountered',
  contentParagraphs: [
    'Oops! We are experiencing some technical difficulties at the moment and are unable to display the requested page. Our team has been notified.',
    'We apologize for any inconvenience this may cause. Please try again later, and thank you for your patience.',
  ],
};

const MESSAGES: TranslatedErrorTemplateContexts = {
  en: {
    genericError: CATCH_ALL,
    notFound: {
      title: 'Page not found',
      contentParagraphs: ['404 Not found.'],
    },
  },
  de: {
    genericError: {
      title: 'Ein Fehler ist aufgetreten',
      contentParagraphs: [
        'Huch! Wir haben zur Zeit technische Schwierigkeiten und können die angeforderte Seite nicht anzeigen. Unser Team wurde darüber informiert.',
        'Wir entschuldigen uns für die Unannehmlichkeiten. Bitte versuchen Sie es später noch einmal. Danke für Ihre Geduld.',
      ],
    },
    notFound: {
      title: 'Seite nicht gefunden',
      contentParagraphs: ['404 Nicht gefunden.'],
    },
  },
};

export function getErrorMessages(
  language: string,
  key: string
): ErrorTemplateContext {
  if (!(language in MESSAGES)) {
    language = 'en';
  }
  if (!(key in MESSAGES[language])) {
    return CATCH_ALL;
  }
  return MESSAGES[language][key];
}
