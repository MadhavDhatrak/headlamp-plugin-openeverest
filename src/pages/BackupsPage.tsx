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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { BackupStatusChip } from '../components/BackupStatusChip';
import { DeleteBackupDialog } from '../components/DeleteBackupDialog';
import { Backup } from '../crd/Backup';
import { useBackups } from '../hooks/useBackups';

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

export function BackupsPage() {
  const { backups, backupStorages, isLoading, error, stats } = useBackups();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);

  const filteredBackups = useMemo(() => {
    if (!search.trim()) return backups;
    const q = search.toLowerCase();
    return backups.filter(b => {
      const name = b.metadata?.name?.toLowerCase() || '';
      const ns = b.metadata?.namespace?.toLowerCase() || '';
      const targetDb = b.targetInstanceName.toLowerCase();
      const storage = b.storageName.toLowerCase();
      return (
        name.includes(q) ||
        ns.includes(q) ||
        targetDb.includes(q) ||
        storage.includes(q)
      );
    });
  }, [backups, search]);

  const filteredStorages = useMemo(() => {
    if (!search.trim()) return backupStorages;
    const q = search.toLowerCase();
    return backupStorages.filter(s => {
      const name = s.metadata?.name?.toLowerCase() || '';
      const ns = s.metadata?.namespace?.toLowerCase() || '';
      const bucket = s.bucket.toLowerCase();
      return name.includes(q) || ns.includes(q) || bucket.includes(q);
    });
  }, [backupStorages, search]);

  return (
    <SectionBox
      title="Backups & Storage"
      headerProps={{
        actions: [
          <Button
            key="refresh"
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:refresh" />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>,
        ],
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Backups
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary">
                  Succeeded
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'success.main' }}>
                  {stats.succeeded}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary">
                  Running
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'info.main' }}>
                  {stats.running}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'warning.main' }}>
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'error.main' }}>
                  {stats.failed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {backupStorages.length === 0 && !isLoading && (
          <Alert severity="warning" icon={<Icon icon="mdi:alert-outline" width={22} height={22} />}>
            No backup storage configured. Create a BackupStorage custom resource to store database snapshots.
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            Failed to load backups data: {error.message || String(error)}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab
              label={`Backups (${backups.length})`}
              icon={<Icon icon="mdi:database-arrow-up" width={18} height={18} />}
              iconPosition="start"
            />
            <Tab
              label={`Backup Storages (${backupStorages.length})`}
              icon={<Icon icon="mdi:cloud-outline" width={18} height={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={activeTab === 0 ? 'Search backups by name, database, storage...' : 'Search storage by name, bucket...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:magnify" width={20} height={20} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 360 }}
          />
        </Box>

        {activeTab === 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Database Instance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Storage</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading backups...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredBackups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Icon icon="mdi:database-search-outline" width={48} height={48} color="#9e9e9e" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                        No backups found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {search ? 'Try adjusting your search criteria' : 'Create snapshots from your database instances to see them here'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  filteredBackups.map(backup => (
                    <TableRow key={backup.metadata.uid || backup.metadata.name} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{backup.metadata.name}</TableCell>
                      <TableCell>{backup.targetInstanceName}</TableCell>
                      <TableCell>{backup.storageName}</TableCell>
                      <TableCell>
                        <BackupStatusChip
                          state={backup.state}
                          message={backup.message}
                        />
                      </TableCell>
                      <TableCell>{backup.backupSize}</TableCell>
                      <TableCell>{formatAge(backup.metadata.creationTimestamp)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete Backup">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(backup)}
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

        {activeTab === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Namespace</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Bucket</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Region</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Endpoint</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading backup storages...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredStorages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Icon icon="mdi:cloud-search-outline" width={48} height={48} color="#9e9e9e" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                        No backup storages found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure a BackupStorage resource in the cluster to enable backup destinations
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  filteredStorages.map(storage => (
                    <TableRow key={storage.metadata.uid || storage.metadata.name} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{storage.metadata.name}</TableCell>
                      <TableCell>{storage.metadata.namespace || 'default'}</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase' }}>{storage.storageType}</TableCell>
                      <TableCell>{storage.bucket}</TableCell>
                      <TableCell>{storage.region}</TableCell>
                      <TableCell>{storage.endpointURL}</TableCell>
                      <TableCell>{formatAge(storage.metadata.creationTimestamp)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <DeleteBackupDialog
        open={Boolean(deleteTarget)}
        backup={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </SectionBox>
  );
}
