import { defineCliConfig } from 'sanity/cli';
import { CLIENTE } from './cliente.js';

export default defineCliConfig({
  api: { projectId: CLIENTE.projectId, dataset: CLIENTE.dataset },
  studioHost: CLIENTE.studioHost,
  deployment: { appId: CLIENTE.studioAppId, autoUpdates: true },
});
