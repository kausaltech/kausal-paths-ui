import { useTranslation } from 'react-i18next';
import PlotlyPlot from 'react-plotly.js';
import fiLocale from 'plotly.js-locales/fi';


export default function Plot(props) {
  let config = props.config || {};
  let layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();

  if (i18n.language === 'fi') {
    config.locales = {fi: fiLocale};
    config.locale = 'fi';
    separators = ', ';
  } else if (i18n.language === 'en') {
    config.locale = 'en';
    separators = '.,'
  }
  props = {...props, config, layout: {...layout, separators}};
  return <PlotlyPlot {...props} />
}
