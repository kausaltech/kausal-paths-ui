import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
  AllCommunityModule,
  ClientSideRowModelModule,
  CsvExportModule,
  ModuleRegistry,
  provideGlobalGridOptions,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

provideGlobalGridOptions({ theme: 'legacy' });

ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  CsvExportModule,
]);

export default AgGridReact;
