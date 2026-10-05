import { Icon } from '@iconify/react';
import { Router } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Provider } from '../crd/Provider';
import { useExtensionsCatalog } from '../hooks/useExtensionsCatalog';

export function ExtensionDetailPage() {
  const { name } = useParams<{ name: string }>();
  const history = useHistory();
  const { items, isLoading, error } = useExtensionsCatalog();
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    try {
      history.push(Router.createRouteURL('/openeverest/providers'));
    } catch {
      history.push('/openeverest/providers');
    }
  };

  const item = items.find(i => i.extension.name === name);

  const handleCopy = () => {
    if (item?.helmCommand) {
      navigator.clipboard.writeText(item.helmCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <SectionBox>
        <Button
          startIcon={<Icon icon="mdi:arrow-left" />}
          onClick={handleBack}
          sx={{ mb: 3, textTransform: 'none' }}
        >
          Back to Extensions
        </Button>
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
        </Grid>
      </SectionBox>
    );
  }

  if (!item) {
    return (
      <SectionBox>
        <Button
          startIcon={<Icon icon="mdi:arrow-left" />}
          onClick={handleBack}
          sx={{ mb: 3, textTransform: 'none' }}
        >
          Back to Extensions
        </Button>
        <Alert severity="warning">
          Extension "{name}" was not found in the catalog.
        </Alert>
      </SectionBox>
    );
  }

  const { extension, isInstalled, isReady, installedVersion, helmCommand, installedResource } = item;
  const prerequisites = extension.install?.prerequisites;
  const providerResource = installedResource instanceof Provider ? installedResource : null;

  return (
    <SectionBox>
      {/* Back Button */}
      <Button
        startIcon={<Icon icon="mdi:arrow-left" />}
        onClick={handleBack}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
      >
        Back to Extensions
      </Button>

      {/* Hero Header Card */}
      <Card elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2.5 }}>
          {extension.icon ? (
            <Box
              component="img"
              src={extension.icon}
              alt={extension.displayName}
              sx={{
                width: 64,
                height: 64,
                objectFit: 'contain',
                borderRadius: 2,
                p: 1,
                bgcolor: 'action.hover',
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: extension.type === 'provider' ? 'primary.light' : 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Icon icon={extension.type === 'provider' ? 'mdi:database' : 'mdi:puzzle'} width={36} />
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {extension.displayName}
              </Typography>
              <Chip
                size="small"
                label={extension.type}
                variant="outlined"
                sx={{
                  textTransform: 'capitalize',
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
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {extension.name}
            </Typography>
          </Box>

          {/* Installed Status Badge */}
          <Box>
            {isInstalled ? (
              <Chip
                icon={<Icon icon={isReady ? 'mdi:check-circle' : 'mdi:alert-circle'} />}
                label={`Installed ${installedVersion ? `(v${installedVersion})` : ''}`}
                color={isReady ? 'success' : 'warning'}
                sx={{ px: 1, py: 2, fontSize: '0.9rem', fontWeight: 600 }}
              />
            ) : (
              <Chip
                icon={<Icon icon="mdi:cloud-download-outline" />}
                label="Not Installed"
                variant="outlined"
                sx={{ px: 1, py: 2, fontSize: '0.9rem', fontWeight: 500 }}
              />
            )}
          </Box>
        </Box>
      </Card>

      {/* Main Grid Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Description, Prerequisites, Versions, Helm */}
        <Grid item xs={12} md={8}>
          {/* About & Description */}
          <Card elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              About
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {extension.description}
            </Typography>

            {/* Categories */}
            {extension.categories && extension.categories.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {extension.categories.map(cat => (
                    <Chip key={cat} label={cat} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Card>

          {/* Prerequisites Warning / Info Section */}
          {prerequisites && prerequisites.length > 0 && (
            <Card elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '4px solid #ed6c02' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Icon icon="mdi:alert-circle-outline" width={22} color="#ed6c02" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Prerequisites Required
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This extension requires the following components to be present in your Kubernetes cluster:
              </Typography>
              {prerequisites.map(prereq => (
                <Box key={prereq.name} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {prereq.name}
                    </Typography>
                    {prereq.installUrl && (
                      <Button
                        size="small"
                        href={prereq.installUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<Icon icon="mdi:open-in-new" width={14} />}
                        sx={{ textTransform: 'none' }}
                      >
                        Install Guide
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {prereq.description}
                  </Typography>
                </Box>
              ))}
            </Card>
          )}

          {/* Supported Database Versions (if installed Provider) */}
          {providerResource && providerResource.availableVersions.length > 0 && (
            <Card elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                Supported Database Versions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Versions supported by the installed operator on this cluster:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {providerResource.availableVersions.map(ver => (
                  <Chip
                    key={ver}
                    label={ver === providerResource.defaultVersion ? `${ver} (default)` : ver}
                    color={ver === providerResource.defaultVersion ? 'primary' : 'default'}
                    variant={ver === providerResource.defaultVersion ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Card>
          )}

          {/* Installation / Helm Command */}
          {helmCommand && (
            <Card elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Installation via Helm
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Run this command with <code>kubectl</code> / <code>helm</code> to install this extension on your cluster:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#1e1e1e',
                  color: '#d4d4d4',
                  borderRadius: 1.5,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    m: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {helmCommand}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy command'}>
                  <IconButton onClick={handleCopy} sx={{ color: copied ? '#4caf50' : '#fff' }}>
                    <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width={20} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          )}
        </Grid>

        {/* Right Column: Metadata, Links, Info */}
        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Details
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {extension.type}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Maturity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {extension.maturity}
                </Typography>
              </Box>

              <Divider />

              {extension.license && (
                <>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      License
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {extension.license}
                    </Typography>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Links */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Links & Repository
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {extension.homepage && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      href={extension.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<Icon icon="mdi:web" />}
                      endIcon={<Icon icon="mdi:open-in-new" width={14} />}
                      sx={{ textTransform: 'none', justifyContent: 'space-between' }}
                    >
                      Homepage
                    </Button>
                  )}
                  {extension.sourceRepo && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      href={extension.sourceRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<Icon icon="mdi:github" />}
                      endIcon={<Icon icon="mdi:open-in-new" width={14} />}
                      sx={{ textTransform: 'none', justifyContent: 'space-between' }}
                    >
                      Source Repository
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Maintainers */}
              {extension.maintainers && extension.maintainers.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Maintainers
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {extension.maintainers.map((m, idx) => (
                        <Box key={idx} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {m.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                            {m.github && (
                              <Button
                                size="small"
                                href={`https://github.com/${m.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<Icon icon="mdi:github" width={14} />}
                                endIcon={<Icon icon="mdi:open-in-new" width={12} />}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', p: '2px 6px', minWidth: 0 }}
                              >
                                @{m.github}
                              </Button>
                            )}
                            {m.email && (
                              <Button
                                size="small"
                                href={`mailto:${m.email}`}
                                startIcon={<Icon icon="mdi:email-outline" width={14} />}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', p: '2px 6px', minWidth: 0 }}
                              >
                                Email
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              )}

              {/* Install target info */}
              {extension.install?.helm && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Helm Release Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {extension.install.helm.releaseName}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Target Namespace
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {extension.install.helm.namespace}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </SectionBox>
  );
}
