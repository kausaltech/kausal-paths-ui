import 'cytoscape';

declare module 'cytoscape' {
  interface Core {
    pdf(options: {
      full?: boolean;
      bg?: string | false;
      paperSize?: string;
      orientation?: 'PORTRAIT' | 'LANDSCAPE';
    }): Promise<Blob>;
  }
}
