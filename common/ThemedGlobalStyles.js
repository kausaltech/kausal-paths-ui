import React from 'react';
import { createGlobalStyle, withTheme } from 'styled-components';

import { formatUrl } from 'common/urls';
import Fonts from './fonts';


const GlobalStyle = createGlobalStyle`
  body {
    font-family: ${(props) => props.theme.fontFamily}, ${(props) => props.theme.fontFamilyFallback};
    font-size: ${(props) => props.theme.fontSizeBase};
    line-height: ${(props) => props.theme.lineHeightBase};
    text-rendering: optimizeLegibility;
    background: ${(props) => props.theme.themeColors.white};
    color: ${(props) => props.theme.themeColors.black};
  }

  input {
    background-color: transparent;
    border: 0px solid;
    height: 20px;
    width: 160px;
    color: #CCC;
}

*:focus {
    outline: none !important;
    box-shadow: none !important;
}

body:not(.user-is-tabbing) button:focus,
body:not(.user-is-tabbing) input:focus,
body:not(.user-is-tabbing) select:focus,
body:not(.user-is-tabbing) textarea:focus {
  outline: none !important;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none !important;
}

button.btn:focus {
  outline:0 !important;
  box-shadow: 0 0 0 0 #fff !important;

}
  a {
    color: ${(props) => props.theme.brandDark};

    &:hover {
      color: ${(props) => props.theme.brandDark};
    }
  }

  // To prevent browser tooltip on titled inline svgs
  svg {
    pointer-events: none;
  }

  h1, h2, h3 , h4, h5, h6 {
    font-family: ${(props) => props.theme.headingsFontFamily}, ${(props) => props.theme.headingsFontFamilyFallback};
    font-weight: ${(props) => props.theme.headingsFontWeight};
    line-height: ${(props) => props.theme.lineHeightMd};
    color: ${(props) => props.theme.headingsColor};
  }

  h1 {
    font-size: ${(props) => props.theme.fontSizeXxl};
  }

  h2 {
    font-size: ${(props) => props.theme.fontSizeXl};
  }

  h3 {
    font-size: ${(props) => props.theme.fontSizeLg};
  }

  h4 {
    font-size: ${(props) => props.theme.fontSizeMd};
  }

  h5 {
    font-size: ${(props) => props.theme.fontSizeBase};
  }

  h6 {
    font-size: ${(props) => props.theme.fontSizeSm};
  }

  p {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  hr {
    margin: ${(props) => props.theme.spaces.s100} 0;
    color: ${(props) => props.theme.themeColors.dark};
    background-color: currentColor;
    border: 0;
  }

  hr:not([size]) {
    height: 1px;
  }

  .icon {
    fill: currentColor;
    vertical-align: -0.1em;
    overflow: hidden;
  }

  blockquote {
    margin-left: 2em;
    padding-left: 1em;
    border-left: #cccccc 3px solid;
  }

  .text-content {
    a {
      text-decoration: underline;
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-all;
      word-break: break-word;

      &:hover {
        text-decoration: none;
      }
    }

    h2 {
      margin-top: ${(props) => props.theme.spaces.s150};
      font-size: ${(props) => props.theme.fontSizeLg};
    }

    h3 {
      margin-top: ${(props) => props.theme.spaces.s150};
      font-size: ${(props) => props.theme.fontSizeMd};
    }

    h4 {
      margin-top: ${(props) => props.theme.spaces.s150};
      font-size: ${(props) => props.theme.fontSizeBase};

      &:first-child {
        margin-top: 0;
      }
    }

    h5 {
      font-size: ${(props) => props.theme.fontSizeBase}
    }
  }

  .richtext-image {
    margin: ${(props) => props.theme.spaces.s150} 0;

    &.full-width {
      max-width: 100%;
      height: auto;
    }
  }

  thead {
    background-color: ${(props) => props.theme.tableHeadBg};
  }

  .table-hover > tbody > tr:hover {
    background-color: ${(props) => props.theme.tableHoverBg};
  }

  /* Alert headers follow alert text color */
  .alert {
    h1, h2, h3, h4, h5, h6 {
      color: inherit;
    }

    p:last-child {
      margin-bottom: 0;
    }
  }
  /* Fix for flickering tooltip bug */
  .tooltip {
    pointer-events: none;
  }

  /* Larger tooltip for emission scope icon */
  .emission-scope-icon-tooltip {
    text-align: left;
    min-width: 20em;
  }

  /* Form styles overrides */

  /* Validaded invalid field has color background */
  .was-validated .form-control:invalid,
  .form-control.is-invalid,
  .was-validated .custom-select:invalid,
  .custom-select.is-invalid {
    background-color: rgba(${(props) => props.theme.themeColors.danger}, 0.15);
  }


  .form-control, .custom-select {
    &:hover {
      border-color: ${(props) => props.theme.themeColors.black};
    }
  }

  .custom-control-input:checked ~ .custom-control-label::before {
    border-color: ${(props) => props.theme.brandDark};
    background-color: ${(props) => props.theme.brandDark};
  }

  .dropdown-item.active, .dropdown-item:active {
    color: #fff;
    text-decoration: none;
    background-color: ${(props) => props.theme.brandDark};
  }
`;

function ThemedGlobalStyles({ theme, children }) {
  if (typeof window !== 'undefined') {
    const { fontUrl, fontFamily, headingsFontFamily } = theme;
    Fonts(fontFamily, headingsFontFamily, formatUrl(fontUrl));
  }

  return (
    <>
      <GlobalStyle />
      {children}
    </>
  );
}

export default withTheme(React.memo(ThemedGlobalStyles));
