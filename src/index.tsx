/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ExtensionDetailPage } from './pages/ExtensionDetailPage';
import { ProvidersPage } from './pages/ProvidersPage';

// Register OpenEverest main sidebar entry
registerSidebarEntry({
  parent: null,
  name: 'openeverest',
  label: 'OpenEverest',
  icon: 'mdi:database-cog-outline',
  url: '/openeverest/providers',
});

// Register Extensions submenu
registerSidebarEntry({
  parent: 'openeverest',
  name: 'openeverest-providers',
  label: 'Extensions',
  icon: 'mdi:view-grid-outline',
  url: '/openeverest/providers',
});

// Register Catalog Page route
registerRoute({
  path: '/openeverest/providers',
  sidebar: 'openeverest-providers',
  component: () => <ProvidersPage />,
  exact: true,
  name: 'openeverest-providers',
});

// Register Extension Detail Page route
registerRoute({
  path: '/openeverest/providers/:name',
  sidebar: 'openeverest-providers',
  component: () => <ExtensionDetailPage />,
  exact: true,
  name: 'openeverest-provider-detail',
});
