import React, { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import SiteContext from 'context/site';

const StyledFooter = styled.div`
  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    &.stzh-footer {
      padding-bottom: var(--stzh-space-xxxlarge);
    }
  }
`;

const Footer = (props) => {
  const { t } = useTranslation();
  const site = useContext(SiteContext);
  const theme = useTheme();
  const [navIsFixed, setnavIsFixed] = useState(false);
  const [isOpen, toggleOpen] = useState(false);

  return (
    <stzh-footer variant="egov" className="hydrated">
      <StyledFooter className="stzh-footer">
        <div className="stzh-footer__wrapper">
          <div className="stzh-footer__social-link"></div>
          <div className="stzh-footer__logo"></div>
          <div className="stzh-footer__info"></div>
          <div className="stzh-footer__links">
            <div className="stzh-footer__copyright">© 2023 Stadt Zürich</div>
            <div className="stzh-footer__link-list" role="list">
              <slot-fb name="link">
                <stzh-link
                  slot="link"
                  className="stzh-footer__link sc-stzh-link-h sc-stzh-link-s hydrated"
                  role="listitem"
                  tabindex="-1"
                  icon-position="left"
                  size="default"
                  variant="default"
                  text-align="default"
                  badge-type="default"
                  badge-position="icon"
                >
                  <a
                    href="https://www.stadt-zuerich.ch/portal/de/index/footer/rechtliche_hinweise.html"
                    target="_blank"
                    className="stzh-link stzh-link--badge-position-icon stzh-link--align-default stzh-link--size-default stzh-link--default sc-stzh-link"
                    s-object-id="Legal notice"
                  >
                    <div className="stzh-link__inner sc-stzh-link">
                      <div className="stzh-link__icon-wrapper sc-stzh-link sc-stzh-link-s"></div>
                      <div className="stzh-link__text sc-stzh-link">
                        <div className="sc-stzh-link sc-stzh-link-s">
                          Rechtliche Hinweise
                        </div>
                      </div>
                    </div>
                  </a>
                </stzh-link>
                <stzh-link
                  slot="link"
                  className="stzh-footer__link sc-stzh-link-h sc-stzh-link-s hydrated"
                  role="listitem"
                  tabindex="-1"
                  icon-position="left"
                  size="default"
                  variant="default"
                  text-align="default"
                  badge-type="default"
                  badge-position="icon"
                >
                  <a
                    href="https://www.stadt-zuerich.ch/netto-null-cockpit-impressum"
                    target="_blank"
                    className="stzh-link stzh-link--badge-position-icon stzh-link--align-default stzh-link--size-default stzh-link--default sc-stzh-link"
                    s-object-id="Imprint"
                  >
                    <div className="stzh-link__inner sc-stzh-link">
                      <div className="stzh-link__icon-wrapper sc-stzh-link sc-stzh-link-s"></div>
                      <div className="stzh-link__text sc-stzh-link">
                        <div className="sc-stzh-link sc-stzh-link-s">
                          Impressum
                        </div>
                      </div>
                    </div>
                  </a>
                </stzh-link>
                <stzh-link
                  className="stzh-footer__link sc-stzh-link-h sc-stzh-link-s hydrated"
                  slot="link"
                  role="listitem"
                  tabindex="-1"
                  icon-position="left"
                  size="default"
                  variant="default"
                  text-align="default"
                  badge-type="default"
                  badge-position="icon"
                >
                  <a
                    href="https://www.stadt-zuerich.ch/portal/de/index/footer/barrierefreiheit.html"
                    target="_blank"
                    className="stzh-link stzh-link--badge-position-icon stzh-link--align-default stzh-link--size-default stzh-link--default sc-stzh-link"
                    s-object-id="Accessibility"
                  >
                    <div className="stzh-link__inner sc-stzh-link">
                      <div className="stzh-link__icon-wrapper sc-stzh-link sc-stzh-link-s"></div>
                      <div className="stzh-link__text sc-stzh-link">
                        <div className="sc-stzh-link sc-stzh-link-s">
                          Barrierefreiheit
                        </div>
                      </div>
                    </div>
                  </a>
                </stzh-link>
              </slot-fb>
            </div>
          </div>
        </div>
      </StyledFooter>
    </stzh-footer>
  );
};

export default Footer;
