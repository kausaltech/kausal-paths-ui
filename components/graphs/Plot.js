import { useTranslation } from 'react-i18next';
import PlotlyPlot from 'react-plotly.js';
import { fi, en } from 'plotly.js-locales';


export default function Plot(props) {
  let config = props.config || {};
  let layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();

  if (i18n.language === 'fi') {
    config.locales = {fi};
    config.locale = 'fi';
    separators = ', ';
  } else if (i18n.language === 'en') {
    config.locales = {en};
    config.locale = 'en';
    separators = '.,'
  }
  props = {...props, config, layout: {...layout, separators}};
  return <PlotlyPlot {...props} />
}
