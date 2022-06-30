import { useTranslation } from 'next-i18next';
import PlotlyPlot from 'react-plotly.js';
import fiLocale from 'plotly.js-locales/fi';
import svLocale from 'plotly.js-locales/sv';
import deLocale from 'plotly.js-locales/de';
import daLocale from 'plotly.js-locales/da';

export default function Plot(props) {
  const config = props.config || {};
  const layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();

  if (i18n.language === 'fi') {  /* https://en.wikipedia.org/wiki/Decimal_separator#Examples_of_use */
    config.locales = { fi: fiLocale };
    config.locale = 'fi';
    separators = ', ';
  } else if (i18n.language === 'sv') {
    config.locales = { sv: svLocale };
    config.locale = 'sv';
    separators = ', ';
  } else if (i18n.language === 'en') {
    config.locale = 'en';
    separators = '.,';
  } else if (i18n.language === 'de') {
    config.locales = { de: deLocale };
    config.locale = 'de';
    separators = ', ';
  } else if (i18n.language === 'da') {
    config.locales = { da: daLocale };
    config.locale = 'da';
    separators = ', ';
  }
  props = { ...props, config, layout: { ...layout, separators } };
  return <PlotlyPlot {...props} />;
}
