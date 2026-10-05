import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ExtensionCard } from '../components/ExtensionCard';
import { useExtensionsCatalog } from '../hooks/useExtensionsCatalog';

export function ProvidersPage() {
  const { items, counts, isLoading, error, refresh } = useExtensionsCatalog();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Filter by Tab
      if (tabIndex === 1 && item.extension.type !== 'provider') return false;
      if (tabIndex === 2 && item.extension.type !== 'plugin') return false;
      if (tabIndex === 3 && !item.isInstalled) return false;

      // 2. Filter by Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = item.extension.name.toLowerCase().includes(query);
        const matchesDisplay = item.extension.displayName.toLowerCase().includes(query);
        const matchesDesc = item.extension.description.toLowerCase().includes(query);
        return matchesName || matchesDisplay || matchesDesc;
      }

      return true;
    });
  }, [items, tabIndex, search]);

  return (
    <SectionBox>
      {/* Header section */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Extensions Catalog
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.2,
                py: 0.4,
                borderRadius: 4,
                bgcolor: 'success.light',
                color: 'success.contrastText',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <Icon icon="mdi:checkbox-marked-circle-outline" width={14} />
              OpenEverest V2
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Browse and install database providers and UI plugins from the official OpenEverest Hub
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:refresh" />}
            onClick={refresh}
            disabled={isLoading}
            sx={{ textTransform: 'none' }}
          >
            Refresh Catalog
          </Button>
        </Box>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
          Failed to load extensions catalog: {error.message}
        </Alert>
      )}

      {/* Tabs and Search Controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { md: 'center' },
          borderBottom: 1,
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 44 }}
        >
          <Tab label={`All (${counts.total})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label={`Providers (${counts.providers})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label={`Plugins (${counts.plugins})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label={`Installed (${counts.installed})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ pb: { xs: 1, md: 0 }, width: { xs: '100%', md: 280 } }}>
          <TextField
            size="small"
            placeholder="Search extensions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:magnify" width={18} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <Button size="small" onClick={() => setSearch('')} sx={{ minWidth: 20, p: 0 }}>
                    <Icon icon="mdi:close" width={16} />
                  </Button>
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>
      </Box>

      {/* Loading Skeletons */}
      {isLoading ? (
        <Grid container spacing={2.5}>
          {Array.from(new Array(6)).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <Skeleton variant="rounded" width={44} height={44} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={16} />
                  </Box>
                </Box>
                <Skeleton variant="text" height={40} sx={{ mb: 1.5 }} />
                <Skeleton variant="rounded" height={32} />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : filteredItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Icon icon="mdi:package-variant-closed" width={48} style={{ opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            No extensions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {search ? `No items matching "${search}"` : 'No items match the selected tab filter.'}
          </Typography>
          {search && (
            <Button size="small" onClick={() => setSearch('')} sx={{ mt: 2, textTransform: 'none' }}>
              Clear search
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filteredItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.extension.name}>
              <ExtensionCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </SectionBox>
  );
}
