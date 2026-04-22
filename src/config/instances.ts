type WatchLink = {
  title: string | { [key: string]: string };
  url: string | { [key: string]: string };
} | null;

type DemoPage = { id: string; lang: string; title: string; urlPath: string };

type InstanceFixedConfigToBeRemoved = {
  instanceId?: string;
  watchLink?: WatchLink;
  demoPages?: DemoPage[];
};

const instanceConfigs: Record<string, InstanceFixedConfigToBeRemoved> = {
  'cork-nzc': {
    watchLink: {
      title: 'Benefits Dashboard',
      url: 'https://cork-planner.watch-test.kausal.tech/',
    },
  },
  espoo: {
    instanceId: 'espoo',
    watchLink: {
      title: {
        fi: 'Ilmastovahti',
        en: 'Espoo Climate Watch',
        sv: 'Esbo klimatvakt',
      },
      url: {
        fi: 'https://ilmastovahti.espoo.fi',
        en: 'https://ilmastovahti.espoo.fi/en',
        sv: 'https://ilmastovahti.espoo.fi/sv',
      },
    },
  },
  gronlogik: {
    watchLink: {
      title: 'Sunnydale Climate Watch',
      url: 'https://sunnydale.test.kausal.tech/climate',
    },
  },
  healthimpact: {
    watchLink: null,
  },
  ilmastoruoka: {
    watchLink: null,
  },
  'koeln-dev': {
    watchLink: {
      title: 'Klimaschutz-Monitoring',
      url: 'https://koeln-klima-copy1.watch-test.kausal.tech',
    },
  },
  'lappeenranta-nzc': {
    watchLink: {
      title: 'Lappeenrannan ilmastovahti',
      url: 'https://kestavyysvahti.lappeenranta.fi/ilmasto',
    },
  },
  'lappeenranta-syke': {
    watchLink: {
      title: 'Lappeenrannan ilmastovahti',
      url: 'https://kestavyysvahti.lappeenranta.fi/ilmasto',
    },
  },
  longmont: {
    instanceId: 'longmont',
    watchLink: {
      title: {
        en: 'Longmont Indicators',
        'es-US': 'Indicadores de Longmont',
      },
      url: {
        en: 'https://indicators.longmontcolorado.gov',
        'es-US': 'https://indicators.longmontcolorado.gov/es-US',
      },
    },
  },
  hollywood: {
    watchLink: {
      title: 'Sustainability Action Plan',
      url: 'https://climateaction.hollywoodfl.org',
    },
  },
  'muenchen-demo': {
    watchLink: {
      title: 'Maßnahmenplan',
      url: 'https://demo-muenchen.watch-test.kausal.tech/',
    },
  },
  'potsdam-gpc': {
    watchLink: {
      title: 'Klima-Monitor-Potsdam',
      url: 'https://klima-monitor.potsdam.de/',
    },
  },
  saskatoon: {
    watchLink: {
      title: "Saskatoon's Climate Dashboard",
      url: 'https://saskatoon.ca/climatedashboard',
    },
  },
  sunnydale: {
    watchLink: null,
    demoPages: [
      {
        id: 's-en-1',
        lang: 'en',
        title: 'About',
        urlPath: '/demo/about',
      },
      {
        id: 's-de-1',
        lang: 'de',
        title: 'Info',
        urlPath: '/demo/about',
      },
      {
        id: 's-fi-1',
        lang: 'fi',
        title: 'Tietoa palvelusta',
        urlPath: '/demo/about',
      },
    ],
  },
  surrey: {
    watchLink: {
      title: "Surrey's Climate Action Tracker",
      url: 'https://climateactiontracker.surrey.ca/',
    },
  },
  tampere: {
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.tampere.fi',
    },
  },
  zuerich: {
    watchLink: null,
  },
};

export function getInstanceConfig(instanceId: string): InstanceFixedConfigToBeRemoved | undefined {
  return instanceConfigs[instanceId];
}
