import React, { useContext } from 'react';

class NumberParser {
  _group: RegExp;
  _decimal: RegExp;
  _numeral: RegExp;
  _index: (d: string) => string;

  constructor(locale: string) {
    const format = new Intl.NumberFormat(locale);
    const parts = format.formatToParts(12345.6);
    const numerals = Array.from({ length: 10 }).map((_, i) => format.format(i));
    const index = new Map(numerals.map((d, i) => [d, i]));
    this._group = new RegExp(`[${parts.find((d) => d.type === 'group')!.value}]`, 'g');
    this._decimal = new RegExp(`[${parts.find((d) => d.type === 'decimal')!.value}]`);
    this._numeral = new RegExp(`[${numerals.join('')}]`, 'g');
    this._index = (d: string) => index.get(d)!.toString(10);
  }
  parse(s: string): number {
    return (s = s
      .trim()
      .replace(this._group, '')
      .replace(this._decimal, '.')
      .replace(this._numeral, this._index))
      ? +s
      : NaN;
  }
}

export type LocalizedNumbersContextType = {
  format: Intl.NumberFormat;
  parse: NumberParser;
  nrSignificantDigits: number | undefined;
};

export function createNumbersContext(locale: string, nrSignificantDigits: number = 3) {
  return {
    format: new Intl.NumberFormat(locale),
    parse: new NumberParser(locale),
    nrSignificantDigits,
  };
}

const LocalizedNumbersContext = React.createContext<LocalizedNumbersContextType>(
  createNumbersContext('en-US')
);

export const useNumbers = () => {
  return useContext(LocalizedNumbersContext);
};

export default LocalizedNumbersContext;
