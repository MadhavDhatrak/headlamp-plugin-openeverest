import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DatabaseStatusChip } from '../components/DatabaseStatusChip';
import { DeleteDatabaseDialog } from '../components/DeleteDatabaseDialog';
import { Instance } from '../crd/Instance';
import { useInstances } from '../hooks/useInstances';

function formatAge(timestamp?: string): string {
  if (!timestamp) return '-';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function DatabaseListPage() {
  const history = useHistory();
  const { instances, isLoading, error, stats } = useInstances();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Instance | null>(null);

  const filteredInstances = useMemo(() => {
    if (!search.trim()) return instances;
    const q = search.toLowerCase();
    return instances.filter(inst => {
      const name = inst.metadata.name?.toLowerCase() || '';
      const ns = inst.metadata.namespace?.toLowerCase() || '';
      const provider = inst.providerName?.toLowerCase() || '';
      return name.includes(q) || ns.includes(q) || provider.includes(q);
    });
  }, [instances, search]);

  return (
    <SectionBox>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Databases
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and monitor your OpenEverest database clusters across namespaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon icon="mdi:plus" width={20} height={20} />}
          onClick={() => history.push('/openeverest/databases/create')}
          sx={{ fontWeight: 600, textTransform: 'none', px: 2.5 }}
        >
          Create Database
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Databases
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                Ready
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                {stats.ready}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                Provisioning
              </Typography>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                {stats.creating}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                Failed
              </Typography>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'Failed to fetch database instances from Kubernetes'}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, namespace, provider..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={18} height={18} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredInstances.length === 0 ? (
        <Card variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
          <CardContent>
            <Icon icon="mdi:database-outline" width={48} height={48} color="gray" />
            <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 600 }}>
              {search ? 'No matching databases found' : 'No databases found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {search
                ? 'Try adjusting your search criteria'
                : 'Create your first OpenEverest database cluster to get started'}
            </Typography>
            {!search && (
              <Button
                variant="outlined"
                startIcon={<Icon icon="mdi:plus" width={18} height={18} />}
                onClick={() => history.push('/openeverest/databases/create')}
                sx={{ textTransform: 'none' }}
              >
                Create Database
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Namespace</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nodes</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Storage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Age</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInstances.map(inst => (
                <TableRow key={inst.metadata.uid || inst.metadata.name} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{inst.metadata.name}</TableCell>
                  <TableCell>{inst.metadata.namespace}</TableCell>
                  <TableCell>{inst.providerName}</TableCell>
                  <TableCell>{inst.engineVersion}</TableCell>
                  <TableCell>{inst.replicas}</TableCell>
                  <TableCell>{inst.storageSize}</TableCell>
                  <TableCell>
                    <DatabaseStatusChip phase={inst.phase} />
                  </TableCell>
                  <TableCell>{formatAge(inst.metadata.creationTimestamp)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete database">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(inst)}
                      >
                        <Icon icon="mdi:delete-outline" width={18} height={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DeleteDatabaseDialog
        open={!!deleteTarget}
        instance={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </SectionBox>
  );
}
