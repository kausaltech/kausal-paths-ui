import { useTranslation } from 'next-i18next';
import PlotlyPlot from 'react-plotly.js';
import fiLocale from 'plotly.js-locales/fi';
import svLocale from 'plotly.js-locales/sv';

export default function Plot(props) {
  const config = props.config || {};
  const layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();

  if (i18n.language === 'fi') {
    config.locales = { fi: fiLocale };
    config.locale = 'fi';
    separators = ', ';
  } else if (i18n.language === 'sv') {
    config.locales = { sv: svLocale };
    config.locale = 'sv';
    separators = '.,';
  } else if (i18n.language === 'en') {
    config.locale = 'en';
    separators = '.,';
  }
  props = { ...props, config, layout: { ...layout, separators } };
  return <PlotlyPlot {...props} />;
}
