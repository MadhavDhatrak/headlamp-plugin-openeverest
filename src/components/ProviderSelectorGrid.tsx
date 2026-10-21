import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { Provider } from '../crd/Provider';
import { CatalogExtensionItem, useExtensionsCatalog } from '../hooks/useExtensionsCatalog';

export interface ProviderSelectorGridProps {
  selectedProviderName?: string;
  onSelect: (provider: Provider) => void;
}

export const ProviderSelectorGrid: React.FC<ProviderSelectorGridProps> = ({
  selectedProviderName,
  onSelect,
}) => {
  const { items, isLoading, error } = useExtensionsCatalog();
  const [search, setSearch] = useState('');

  const providerItems = useMemo(() => {
    return items.filter(item => item.extension.type === 'provider');
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return providerItems;
    const q = search.toLowerCase();
    return providerItems.filter(item => {
      const name = item.extension.name.toLowerCase();
      const display = item.extension.displayName.toLowerCase();
      const desc = item.extension.description.toLowerCase();
      return name.includes(q) || display.includes(q) || desc.includes(q);
    });
  }, [providerItems, search]);

  const { installed, uninstalled } = useMemo(() => {
    const installedList: CatalogExtensionItem[] = [];
    const uninstalledList: CatalogExtensionItem[] = [];

    for (const item of filteredItems) {
      if (item.isInstalled && item.installedResource instanceof Provider) {
        installedList.push(item);
      } else {
        uninstalledList.push(item);
      }
    }

    return { installed: installedList, uninstalled: uninstalledList };
  }, [filteredItems]);

  const renderIcon = (iconStr?: string, displayName?: string) => {
    if (!iconStr) {
      return <Icon icon="mdi:database" width={36} height={36} />;
    }
    if (iconStr.startsWith('http') || iconStr.startsWith('/')) {
      return (
        <img
          src={iconStr}
          alt={displayName || 'Provider icon'}
          style={{ width: 36, height: 36, objectFit: 'contain' }}
        />
      );
    }
    return <Icon icon={iconStr} width={36} height={36} />;
  };

  const handleCardClick = (item: CatalogExtensionItem) => {
    if (!item.isInstalled || !(item.installedResource instanceof Provider)) {
      return;
    }
    onSelect(item.installedResource);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load providers: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          Choose a Database Engine
        </Typography>
        <TextField
          size="small"
          placeholder="Filter engines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={18} height={18} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 240 }}
        />
      </Box>

      {installed.length === 0 && uninstalled.length === 0 ? (
        <Alert severity="info">No database providers match your search.</Alert>
      ) : null}

      {installed.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            INSTALLED & READY ENGINES ({installed.length})
          </Typography>
          <Grid container spacing={2}>
            {installed.map(item => {
              const provider = item.installedResource as Provider;
              const isSelected = selectedProviderName === provider.metadata.name;

              return (
                <Grid item xs={12} sm={6} md={4} key={item.extension.name}>
                  <Card
                    variant="outlined"
                    onClick={() => handleCardClick(item)}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 2,
                      p: 1.5,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: isSelected ? 'primary.main' : 'text.secondary',
                        boxShadow: 2,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Box display="flex" alignItems="flex-start" gap={1.5} mb={1}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            backgroundColor: 'action.hover',
                            flexShrink: 0,
                          }}
                        >
                          {renderIcon(item.extension.icon, item.extension.displayName)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {item.extension.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {provider.metadata.name}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label="Installed"
                          color="success"
                          variant="filled"
                          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
                        />
                      </Box>

                      <Tooltip title={item.extension.description || ''} arrow placement="top">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.82rem',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 52,
                          }}
                        >
                          {item.extension.description || 'Database operator extension'}
                        </Typography>
                      </Tooltip>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {uninstalled.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.disabled" sx={{ mb: 1.5, fontWeight: 600 }}>
            AVAILABLE EXTENSIONS ({uninstalled.length})
          </Typography>
          <Grid container spacing={2}>
            {uninstalled.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.extension.name}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    p: 1.5,
                    opacity: 0.65,
                    borderColor: 'divider',
                    backgroundColor: 'action.hover',
                  }}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box display="flex" alignItems="flex-start" gap={1.5} mb={1}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1.5,
                          backgroundColor: 'action.disabledBackground',
                          flexShrink: 0,
                        }}
                      >
                        {renderIcon(item.extension.icon, item.extension.displayName)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600} color="text.secondary" noWrap>
                          {item.extension.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" noWrap display="block">
                          {item.extension.name}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label="Not Installed"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.72rem', color: 'text.disabled' }}
                      />
                    </Box>

                    <Tooltip title={item.extension.description || ''} arrow placement="top">
                      <Typography
                        variant="body2"
                        color="text.disabled"
                        sx={{
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 52,
                        }}
                      >
                        {item.extension.description || 'Database operator extension'}
                      </Typography>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
