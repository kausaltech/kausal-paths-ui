import { Link } from 'common/links';
import { useRouter } from 'next/router';
import Icon from 'components/common/icon';
import styled, { useTheme } from 'styled-components';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

const Selector = styled(UncontrolledDropdown)<{ $mobile: boolean }>`
  a {
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0 0 ${(props) => props.theme.spaces.s050}
      ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
      text-decoration: none;
      color: ${(props) => props.theme.neutralDark};

      .highlighter {
        border-bottom: 5px solid ${(props) => props.theme.brandDark};
      }
    }

    @media (min-width: ${(props) => props.theme.breakpointMd}) {
      align-self: center;
      margin: 0;
    }
  }

  svg {
    fill: ${(props) =>
      props.$mobile
        ? props.theme.themeColors.dark
        : props.theme.brandNavColor} !important;
  }
`;

const CurrentLanguage = styled.span<{ $mobile: boolean }>`
  display: inline-block;
  width: 1.5rem;
  margin: 0 0.5rem;
  text-transform: uppercase;
  font-size: 90%;
  color: ${(props) =>
    props.$mobile ? props.theme.themeColors.dark : props.theme.brandNavColor};
`;

const StyledDropdownMenu = styled(DropdownMenu)`
  right: 0;
`;

const languageNames = {
  fi: 'Suomi',
  en: 'English',
  de: 'Deutsch',
  sv: 'Svenska',
};

function LanguageSelector({ mobile }: { mobile: boolean }) {
  const router = useRouter();
  const theme = useTheme();

  const { locales } = router;
  if (!locales || locales.length < 2) return null;
  const handleLocaleChange = (ev) => {
    ev.preventDefault();
    window.location.href = ev.target.href;
  };

  const getLanguageCodeLabel = (lang) => {
    if (lang.includes('-')) {
      return lang.split('-')[0];
    }
    return lang;
  };

  return (
    <Selector nav inNavbar $mobile={mobile} className={mobile && 'd-md-none'}>
      <DropdownToggle nav>
        <Icon name="globe" color={theme.neutralDark} />
        <CurrentLanguage $mobile={mobile}>
          {getLanguageCodeLabel(router.locale)}
        </CurrentLanguage>
      </DropdownToggle>
      <StyledDropdownMenu end>
        {locales.map((locale) => (
          <DropdownItem key={locale} tag="div">
            <Link locale={locale} href="/">
              <a onClick={handleLocaleChange}>
                {languageNames[getLanguageCodeLabel(locale)]}
              </a>
            </Link>
          </DropdownItem>
        ))}
      </StyledDropdownMenu>
    </Selector>
  );
}

export default LanguageSelector;
