import { useLocale } from 'next-intl';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';

import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';
import { transientOptions } from '@common/themes/styles/styled';

import { useInstance } from '@/common/instance';
import { Link } from '@/common/links';
import Icon from '@/components/common/icon';

const Selector = styled(UncontrolledDropdown, transientOptions)<{ $mobile: boolean }>`
  a {
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0 0 ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
      text-decoration: none;
      color: ${(props) => props.theme.neutralDark};

      .highlighter {
        border-bottom: 5px solid ${(props) => props.theme.brandDark};
      }
    }

    @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
      align-self: center;
      margin: 0;
    }
  }

  svg {
    fill: ${(props) =>
      props.$mobile ? props.theme.themeColors.dark : props.theme.brandNavColor} !important;
  }
`;

const CurrentLanguage = styled('span', transientOptions)<{ $mobile: boolean }>`
  display: inline-block;
  width: 1.5rem;
  margin: 0 0.5rem;
  text-transform: uppercase;
  font-size: 90%;
  color: ${(props) => (props.$mobile ? props.theme.themeColors.dark : props.theme.brandNavColor)};
`;

const StyledDropdownMenu = styled(DropdownMenu)`
  right: 0;
`;

const languageNames = {
  fi: 'Suomi',
  en: 'English',
  de: 'Deutsch',
  sv: 'Svenska',
  cs: 'Čeština',
  da: 'Dansk',
  lv: 'Latviešu',
  pl: 'Polski',
  es: 'Español',
  el: 'Ελληνικά',
};

function getLanguageCodeLabel(lang: string) {
  if (lang.includes('-')) {
    return lang.split('-')[0];
  }
  return lang;
}

function LanguageSelector({ mobile }: { mobile: boolean }) {
  const theme = useTheme();
  const locale = useLocale();
  const { supportedLanguages: planLocales } = useInstance();

  const locales = planLocales;

  if (!locales || locales.length < 2) return null;
  const handleLocaleChange = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    // eslint-disable-next-line react-compiler/react-compiler
    window.location.href = ev.currentTarget.href;
  };

  return (
    <Selector nav inNavbar $mobile={mobile} className={mobile ? 'd-md-none' : undefined}>
      <DropdownToggle nav>
        <Icon name="globe" color={theme.neutralDark} />
        <CurrentLanguage $mobile={mobile}>{getLanguageCodeLabel(locale)}</CurrentLanguage>
      </DropdownToggle>
      <StyledDropdownMenu end>
        {locales.map((locale) => (
          <DropdownItem key={locale} tag="div">
            <Link locale={locale} href="/" onClick={handleLocaleChange}>
              {languageNames[getLanguageCodeLabel(locale)]}
            </Link>
          </DropdownItem>
        ))}
      </StyledDropdownMenu>
    </Selector>
  );
}

export default LanguageSelector;
