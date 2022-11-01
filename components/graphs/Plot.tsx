import { useTranslation } from 'next-i18next';
import PlotlyPlot, { PlotParams } from 'react-plotly.js';
import fi from 'plotly.js-locales/fi';
import sv from 'plotly.js-locales/sv';
import de from 'plotly.js-locales/de';
import de_ch from 'plotly.js-locales/de-ch';

const locales = {
  fi,
  sv,
  de,
  "de-CH": de_ch,
}


export default function Plot(props: PlotParams) {
  const config = props.config || {};
  const layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();

  config.locales = locales;
  if (i18n.language === 'fi') {
    config.locale = 'fi';
    separators = ', ';
  } else if (i18n.language === 'sv') {
    config.locale = 'sv';
    separators = '.,';
  } else if (i18n.language === 'en') {
    config.locale = 'en';
    separators = '.,';
  } else if (i18n.language === 'de') {
    config.locale = 'de';
    separators = ',.';
  } else if (i18n.language === 'de-CH') {
    config.locale = 'de-CH';
    separators = '.,';
  }
  props = { ...props, config, layout: { ...layout, separators } };
  return <PlotlyPlot {...props} />;
}
