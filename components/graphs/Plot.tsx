import { useTranslation } from 'next-i18next';
import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js/dist/plotly';
import type { Config } from 'plotly.js';
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

const PlotlyPlot = createPlotlyComponent(Plotly);


export default function Plot(props: PlotParams) {
  const { data } = props;
  const config: NonNullable<PlotParams['config']> = props.config || {};
  const layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();
  const lang = i18n.language;

  config.locales = locales;
  config.locale = lang;
  if (lang == 'fi') {
    separators = ', ';
  } else if (lang == 'sv') {
    separators = '.,';
  } else if (lang == 'en') {
    separators = '.,';
  } else if (lang == 'de') {
    config.locale = 'de';
    separators = ',.';
  } else if (lang == 'de-CH') {
    config.locale = 'de-CH';
    separators = ".'";
  }

  const ret = Plotly.validate(data, layout);
  if (ret && ret.length) {
    console.warn('Plotly validation errors:');
    console.warn(ret);
  }

  console.log(config);
  console.log(layout);

  props = { ...props, config, layout: { ...layout, separators } };
  return <PlotlyPlot {...props} />;
}
