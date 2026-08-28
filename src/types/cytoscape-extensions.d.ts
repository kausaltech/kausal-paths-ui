declare module 'cytoscape-elk' {
  import type cytoscape from 'cytoscape';

  export type ElkLayoutOptions = cytoscape.BaseLayoutOptions & {
    name: 'elk';
    nodeDimensionsIncludeLabels?: boolean;
    elk?: Record<string, string | number | boolean>;
    fit?: boolean;
    padding?: number;
  };

  const elk: cytoscape.Ext;
  export default elk;
}

declare module 'cytoscape-pdf-export' {
  import type cytoscape from 'cytoscape';

  const pdfExport: cytoscape.Ext;
  export default pdfExport;
}
