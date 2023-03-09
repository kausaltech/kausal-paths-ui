import { useTranslation } from 'next-i18next';
import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js';
import fi from 'plotly.js-locales/fi';
import sv from 'plotly.js-locales/sv';
import de from 'plotly.js-locales/de';
import de_ch from 'plotly.js-locales/de-ch';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';


const locales = {
  fi,
  sv,
  de,
  "de-CH": de_ch,
}

const PlotlyPlot = createPlotlyComponent(Plotly);

type PlotProps = PlotParams & {
  noValidate?: boolean,
}

const Plot = (props: PlotProps) => {
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
  data: Plotly.Data[],
  layout?: Partial<Plotly.Layout>,
  config?: Partial<Plotly.Config>,
  noValidate?: boolean,
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
  }, [ref, data, layout, config])

  useEffect(() => {
    return () => {
      const { current } = ref;
      if (current) {
        console.log('purge');
        Plotly.purge(current)
      }
    }
  }, [ref])
  return ref;
}

export default Plot;
