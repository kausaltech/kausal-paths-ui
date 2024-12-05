import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { useTranslation } from 'next-i18next';
import Plotly from 'plotly.js';
import cs from 'plotly.js-locales/cs';
import da from 'plotly.js-locales/da';
import de from 'plotly.js-locales/de';
import de_ch from 'plotly.js-locales/de-ch';
import el from 'plotly.js-locales/el';
import es from 'plotly.js-locales/es';
import fi from 'plotly.js-locales/fi';
import lv from 'plotly.js-locales/lv';
import pl from 'plotly.js-locales/pl';
import sv from 'plotly.js-locales/sv';
import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';

const locales = { fi, sv, de, 'de-CH': de_ch, cs, da, lv, pl, 'es-US': es, el };

const PlotlyPlot = createPlotlyComponent(Plotly);

type PlotProps = PlotParams & {
  noValidate?: boolean;
};

const Plot = (props: PlotProps) => {
  const { data } = props;
  const config: NonNullable<PlotParams['config']> = props.config || {};
  const layout = props.layout || {};
  let separators;
  const { i18n } = useTranslation();
  const lang = i18n.language;

  config.locales = locales;
  config.locale = lang;

  switch (lang) {
    case 'fi':
      separators = ', ';
      break;
    case 'de':
      config.locale = 'de';
      separators = ',.';
      break;
    case 'de-CH':
      config.locale = 'de-CH';
      separators = ".'";
      break;
    case 'cs':
    case 'da':
    case 'pl':
      separators = '.,';
      break;
    case 'el':
    case 'lv':
      separators = ',.';
      break;
    case 'sv':
    case 'en':
    case 'es-US':
      config.locale = 'es-US';
      separators = '.,';
      break;
    default:
      separators = '.,';
      break;
  }

  config.responsive = true;
  if (!props.noValidate) {
    // @ts-ignore
    const ret = Plotly.validate(data, layout);
    if (ret && ret.length) {
      console.warn('Plotly validation returned errors');
      console.log(ret);
    }
  }
  props = { ...props, config, layout: { ...layout, separators } };
  return <PlotlyPlot {...props} />;
};

type UsePlotlyArgs = {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  noValidate?: boolean;
};

export function usePlotlyBasic({ data, layout, config, noValidate }: UsePlotlyArgs) {
  const ref = useRef<HTMLDivElement>(null);

  if (!noValidate) {
    // @ts-ignore
    const ret = Plotly.validate(data, layout);
    if (ret && ret.length) {
      console.warn('Plotly validation errors:');
      console.log(ret);
    }
  }
  useLayoutEffect(() => {
    const { current } = ref;
    if (current) {
      Plotly.react(current, data, layout, config);
    }
  }, [ref, data, layout, config]);

  useEffect(() => {
    return () => {
      const { current } = ref;
      if (current) {
        console.log('purge');
        Plotly.purge(current);
      }
    };
  }, [ref]);
  return ref;
}

export function BasicPlot(props: UsePlotlyArgs & React.HTMLAttributes<HTMLDivElement>) {
  const { data, layout, config, noValidate, ...rest } = props;
  const ref = usePlotlyBasic({ data, layout, config, noValidate });
  return <div ref={ref} {...rest} />;
}

export default Plot;
