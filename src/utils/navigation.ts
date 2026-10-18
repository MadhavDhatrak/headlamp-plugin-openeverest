import { Router } from '@kinvolk/headlamp-plugin/lib';

export const routes = {
  databases: () => Router.createRouteURL('openeverest-databases'),
  createDatabase: () => Router.createRouteURL('openeverest-create-database'),
  providers: () => Router.createRouteURL('openeverest-providers'),
  providerDetail: (name: string) =>
    Router.createRouteURL('openeverest-provider-detail', { name }),
};
