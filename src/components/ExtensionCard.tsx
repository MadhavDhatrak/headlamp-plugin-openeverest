import { Icon } from '@iconify/react';
import { Router } from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { CatalogExtensionItem } from '../hooks/useExtensionsCatalog';

interface ExtensionCardProps {
  item: CatalogExtensionItem;
}

export function ExtensionCard({ item }: ExtensionCardProps) {
  const { extension, isInstalled, isReady, installedVersion } = item;
  const history = useHistory();

  const handleOpenDetails = () => {
    try {
      const url = Router.createRouteURL('/openeverest/providers/:name', { name: extension.name });
      history.push(url);
    } catch {
      history.push(`/openeverest/providers/${extension.name}`);
    }
  };

  const getMaturityColor = (maturity: string) => {
    switch (maturity) {
      case 'stable':
        return { color: '#2e7d32', bg: '#edf7ed', border: '#b7dfb9' };
      case 'beta':
        return { color: '#ed6c02', bg: '#fff4e5', border: '#ffdca8' };
      default:
        return { color: '#0288d1', bg: '#e1f5fe', border: '#b3e5fc' };
    }
  };

  const maturityStyle = getMaturityColor(extension.maturity);

  return (
    <Card
      elevation={2}
      onClick={handleOpenDetails}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Top Header: Logo + Title + Type/Maturity Badges */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          {extension.icon ? (
            <Box
              component="img"
              src={extension.icon}
              alt={extension.displayName}
              sx={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                borderRadius: 1.5,
                p: 0.5,
                bgcolor: 'action.hover',
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                bgcolor: extension.type === 'provider' ? 'primary.light' : 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Icon
                icon={extension.type === 'provider' ? 'mdi:database' : 'mdi:puzzle'}
                width={26}
              />
            </Box>
          )}

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                {extension.displayName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Chip
                  size="small"
                  label={extension.type}
                  variant="outlined"
                  sx={{
                    textTransform: 'capitalize',
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 600,
                    color: '#ffffff !important',
                    borderColor: 'rgba(255, 255, 255, 0.7) !important',
                    '& .MuiChip-label': {
                      color: '#ffffff !important',
                    },
                  }}
                />
                <Chip
                  size="small"
                  label={extension.maturity}
                  sx={{
                    textTransform: 'capitalize',
                    fontSize: '0.7rem',
                    height: 20,
                    bgcolor: maturityStyle.bg,
                    color: maturityStyle.color,
                    borderColor: maturityStyle.border,
                  }}
                  variant="outlined"
                />
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {extension.name}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            minHeight: 40,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mb: 1.5,
          }}
        >
          {extension.description}
        </Typography>

        {/* Status indicator row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isInstalled ? (
            <Chip
              size="small"
              icon={<Icon icon={isReady ? 'mdi:check-circle' : 'mdi:alert-circle'} />}
              label={`Installed ${installedVersion ? `(v${installedVersion})` : ''}`}
              color={isReady ? 'success' : 'warning'}
              sx={{ fontWeight: 500 }}
            />
          ) : (
            <Chip
              size="small"
              icon={<Icon icon="mdi:cloud-download-outline" />}
              label="Not Installed"
              variant="outlined"
              color="default"
              sx={{ fontWeight: 500 }}
            />
          )}

          {extension.access && extension.access !== 'public' && (
            <Chip size="small" label={extension.access} variant="outlined" sx={{ fontSize: '0.7rem' }} />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="outlined"
          endIcon={<Icon icon="mdi:chevron-right" width={16} />}
          onClick={handleOpenDetails}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
