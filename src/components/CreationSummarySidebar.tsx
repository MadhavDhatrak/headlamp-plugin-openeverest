import { Icon } from '@iconify/react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import React from 'react';
import { Provider } from '../crd/Provider';
import { UiTopologySchema } from '../schema/uiSchema';
import { flattenComponents } from '../utils/buildInstance';

export interface CreationSummarySidebarProps {
  provider?: Provider | null;
  topology?: string;
  instanceName?: string;
  namespace?: string;
  topologySchema?: UiTopologySchema;
  formValues?: Record<string, any>;
}

export const CreationSummarySidebar: React.FC<CreationSummarySidebarProps> = ({
  provider,
  topology,
  instanceName,
  namespace = 'default',
  topologySchema,
  formValues = {},
}) => {
  const sectionsOrder = topologySchema?.sectionsOrder || [];

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        position: 'sticky',
        top: 24,
        boxShadow: 1,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          fontWeight={700}
          sx={{ mb: 1.5, letterSpacing: 0.5 }}
        >
          CONFIGURATION SUMMARY
        </Typography>

        {provider && (
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                backgroundColor: 'action.hover',
              }}
            >
              <Icon icon="mdi:database" width={26} height={26} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {provider.metadata.name}
              </Typography>
              {topology && (
                <Chip
                  size="small"
                  label={topology}
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, mt: 0.2 }}
                />
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" flexDirection="column" gap={1.2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {instanceName?.trim() || <em style={{ opacity: 0.5 }}>Not specified</em>}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Namespace:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {namespace?.trim() || 'default'}
            </Typography>
          </Box>

          {formValues['spec.version'] && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Version:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formValues['spec.version']}
              </Typography>
            </Box>
          )}
        </Box>

        {sectionsOrder.map(secKey => {
          const section = topologySchema?.sections?.[secKey];
          if (!section || !section.components) return null;

          const flatNodes = flattenComponents(section.components);
          const fields = flatNodes
            .map(node => {
              const fieldKey = node.path || node.id || '';
              if (!fieldKey || fieldKey === 'spec.version') return null;
              const rawVal = formValues[fieldKey];
              if (rawVal === undefined || rawVal === null || rawVal === '') return null;

              const label = node.fieldParams?.label || node.label || fieldKey;
              const badge = node.fieldParams?.badge ? ` ${node.fieldParams.badge}` : '';
              const displayVal =
                typeof rawVal === 'boolean'
                  ? rawVal
                    ? 'Enabled'
                    : 'Disabled'
                  : `${rawVal}${badge}`;

              return {
                key: fieldKey,
                label,
                displayVal,
              };
            })
            .filter((item): item is { key: string; label: string; displayVal: string } => item !== null);

          if (fields.length === 0) return null;

          return (
            <React.Fragment key={secKey}>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                display="block"
                mb={1}
                sx={{ textTransform: 'uppercase' }}
              >
                {section.label || secKey}
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {fields.map(f => (
                  <Box
                    key={f.key}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                  >
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '60%' }}>
                      {f.label}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '40%' }}>
                      {f.displayVal}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </React.Fragment>
          );
        })}
      </CardContent>
    </Card>
  );
};
