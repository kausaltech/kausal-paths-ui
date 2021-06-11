import { makeVar, InMemoryCache } from '@apollo/client';

export const yearRangeVar = makeVar([]);
export const settingsVar = makeVar({});

export const cache = new InMemoryCache();
