/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
// Plotly doesnt type well, let's disable the linting for this file until it's properly deprecated
import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { useTranslation } from 'next-i18next';
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
import Plotly from 'plotly.js/dist/plotly-basic';
import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';

const locales = { fi, sv, de, 'de-CH': de_ch, cs, da, lv, pl, 'es-US': es, el };

const PlotlyPlot = createPlotlyComponent(Plotly);

type PlotProps = PlotParams & {
  noValidate?: boolean;
};

const Plot = (props: PlotProps) => {
  const { data, noValidate, config: configProp, layout: layoutProp, ...rest } = props;
  const layout = layoutProp || {};
  const { i18n } = useTranslation();
  const lang = i18n.language;

  let locale = lang;
  let separators: string;

  switch (lang) {
    case 'fi':
    case 'sv':
    case 'cs':
    case 'pl':
    case 'lv':
      separators = ', ';
      break;
    case 'de':
      locale = 'de';
      separators = ',.';
      break;
    case 'de-CH':
      locale = 'de-CH';
      separators = ".'";
      break;
    case 'da':
    case 'el':
      separators = ',.';
      break;
    case 'es-US':
      locale = 'es-US';
      separators = '.,';
      break;
    case 'en':
    default:
      separators = '.,';
      break;
  }

  const config = { ...configProp, locales, locale, responsive: true };

  if (!noValidate) {
    const ret = Plotly.validate(data, layout);
    if (ret && ret.length) {
      console.warn('Plotly validation returned errors');
      console.log(ret);
    }
  }
  return <PlotlyPlot data={data} {...rest} config={config} layout={{ ...layout, separators }} />;
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
