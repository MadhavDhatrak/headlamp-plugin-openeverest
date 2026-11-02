import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
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
import { CreateBackupStorageDialog } from '../components/CreateBackupStorageDialog';
import { CreateOnDemandBackupDialog } from '../components/CreateOnDemandBackupDialog';
import { CreateScheduleModal } from '../components/CreateScheduleModal';
import { DeleteBackupDialog } from '../components/DeleteBackupDialog';
import { DeleteBackupStorageDialog } from '../components/DeleteBackupStorageDialog';
import { DeleteScheduleDialog } from '../components/DeleteScheduleDialog';
import { Backup } from '../crd/Backup';
import { BackupClass } from '../crd/BackupClass';
import { BackupStorage } from '../crd/BackupStorage';
import { useBackups } from '../hooks/useBackups';
import { useInstances } from '../hooks/useInstances';
import {
  addScheduleToInstance,
  flattenAllInstanceSchedules,
  FlattenedSchedule,
  getCompatibleBackupClasses,
  InstanceScheduleRow,
  parseCronDisplay,
  updateScheduleInInstance,
} from '../utils/backupSchedules';

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
  const { instances, isLoading: isInstancesLoading } = useInstances();
  const [backupClasses] = BackupClass.useList();

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [filterInstance, setFilterInstance] = useState<string>('all');

  // Top Create Dropdown menu state
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);

  // Dialog & Modal states
  const [isOnDemandOpen, setIsOnDemandOpen] = useState(false);
  const [isCreateStorageOpen, setIsCreateStorageOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit'>('create');
  const [selectedScheduleData, setSelectedScheduleData] = useState<{
    schedule: FlattenedSchedule;
    instanceName: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
  const [deleteStorageTarget, setDeleteStorageTarget] = useState<BackupStorage | null>(null);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<InstanceScheduleRow | null>(null);

  const [scheduleError, setScheduleError] = useState<string | null>(null);

 
  const backupEligibleInstances = useMemo(() => {
    return instances.filter(inst => {
      if (inst.spec?.backup?.classRef?.name) return true;
      return getCompatibleBackupClasses(backupClasses || [], inst.providerName).length > 0;
    });
  }, [instances, backupClasses]);

  // Flatten active schedules across all database instances
  const allSchedules = useMemo(() => {
    return flattenAllInstanceSchedules(instances);
  }, [instances]);

  // Filtered Backups (Tab 0)
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

  // Filtered Schedules (Tab 1)
  const filteredSchedules = useMemo(() => {
    return allSchedules.filter(s => {
      if (filterInstance !== 'all' && s.instanceName !== filterInstance) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = s.name.toLowerCase();
      const instName = s.instanceName.toLowerCase();
      const cron = s.cron.toLowerCase();
      const storage = (s.storageName || '').toLowerCase();
      const bClass = (s.backupClassName || '').toLowerCase();
      return (
        name.includes(q) ||
        instName.includes(q) ||
        cron.includes(q) ||
        storage.includes(q) ||
        bClass.includes(q)
      );
    });
  }, [allSchedules, filterInstance, search]);

  // Filtered Storages (Tab 2)
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

  // Action handlers
  const handleOpenCreateSchedule = () => {
    setScheduleModalMode('create');
    setSelectedScheduleData(null);
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (row: InstanceScheduleRow) => {
    setScheduleModalMode('edit');
    setSelectedScheduleData({
      schedule: row,
      instanceName: row.instanceName,
    });
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (
    schedule: FlattenedSchedule,
    _chosenClassName: string,
    targetInstanceName?: string
  ) => {
    try {
      setScheduleError(null);
      const instanceName = targetInstanceName || selectedScheduleData?.instanceName;
      const targetInstance = instances.find(inst => inst.metadata.name === instanceName);

      if (!targetInstance) {
        setScheduleError(`Database instance "${instanceName}" not found on cluster.`);
        return;
      }

      const patchPayload =
        scheduleModalMode === 'edit'
          ? updateScheduleInInstance(targetInstance, schedule.name, schedule)
          : addScheduleToInstance(targetInstance, schedule);

      await targetInstance.patch(patchPayload);
      setIsScheduleModalOpen(false);
      setSelectedScheduleData(null);
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
      setScheduleError(err?.message || 'Failed to update schedule on database instance');
    }
  };

  return (
    <SectionBox
      title="Backups & Storage"
      headerProps={{
        actions: [
          <Box key="header-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              key="create-backup-btn"
              variant="contained"
              size="small"
              startIcon={<Icon icon="mdi:plus" />}
              endIcon={<Icon icon="mdi:chevron-down" />}
              onClick={e => setCreateMenuAnchor(e.currentTarget)}
            >
              Create backup
            </Button>
            <Button
              key="refresh"
              variant="outlined"
              size="small"
              startIcon={<Icon icon="mdi:refresh" />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>,
        ],
      }}
    >
      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={() => setCreateMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            setIsOnDemandOpen(true);
          }}
        >
          <ListItemIcon>
            <Icon icon="mdi:camera-outline" width={20} height={20} />
          </ListItemIcon>
          <ListItemText
            primary="On-demand (Now)"
            secondary="Trigger an immediate snapshot backup"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            handleOpenCreateSchedule();
          }}
        >
          <ListItemIcon>
            <Icon icon="mdi:clock-outline" width={20} height={20} />
          </ListItemIcon>
          <ListItemText
            primary="Recurring schedule"
            secondary="Configure automated cron-based backups"
          />
        </MenuItem>
      </Menu>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Metric Cards */}
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

        {scheduleError && (
          <Alert severity="error" onClose={() => setScheduleError(null)}>
            {scheduleError}
          </Alert>
        )}

        {/* 3 Dedicated Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab
              label={`Backups (${backups.length})`}
              icon={<Icon icon="mdi:database-arrow-up" width={18} height={18} />}
              iconPosition="start"
            />
            <Tab
              label={`Schedules (${allSchedules.length})`}
              icon={<Icon icon="mdi:calendar-clock" width={18} height={18} />}
              iconPosition="start"
            />
            <Tab
              label={`Backup Storages (${backupStorages.length})`}
              icon={<Icon icon="mdi:cloud-outline" width={18} height={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Filter and Tab Action Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder={
                activeTab === 0
                  ? 'Search backups by name, database, storage...'
                  : activeTab === 1
                  ? 'Search schedules by name, database, cron...'
                  : 'Search storage by name, bucket...'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:magnify" width={18} height={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 340 } }}
            />

            {activeTab === 1 && (
              <FormControl size="small" variant="outlined" sx={{ minWidth: 220 }}>
                <InputLabel id="filter-instance-label">Filter by Database</InputLabel>
                <Select
                  labelId="filter-instance-label"
                  value={filterInstance}
                  label="Filter by Database"
                  onChange={e => setFilterInstance(e.target.value)}
                >
                  <MenuItem value="all">All Databases</MenuItem>
                  {backupEligibleInstances.map(inst => (
                    <MenuItem key={inst.metadata.name} value={inst.metadata.name}>
                      {inst.metadata.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Contextual Action Button per Tab */}
          {activeTab === 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Icon icon="mdi:camera-plus-outline" />}
              onClick={() => setIsOnDemandOpen(true)}
            >
              Create Snapshot
            </Button>
          )}

          {activeTab === 1 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Icon icon="mdi:calendar-plus" />}
              onClick={handleOpenCreateSchedule}
            >
              Add Schedule
            </Button>
          )}

          {activeTab === 2 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Icon icon="mdi:cloud-plus-outline" />}
              onClick={() => setIsCreateStorageOpen(true)}
            >
              Add Backup Storage
            </Button>
          )}
        </Box>

        {/* Tab 0: Physical Snapshot Backups */}
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

        {/* Tab 1: Active Recurring Schedules */}
        {activeTab === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Schedule Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Database Instance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Frequency & Timing</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Storage / Class</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Retention</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isInstancesLoading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading schedules...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isInstancesLoading && filteredSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Icon icon="mdi:calendar-remove-outline" width={48} height={48} color="#9e9e9e" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                        No backup schedules found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {search || filterInstance !== 'all'
                          ? 'Try adjusting your search or database filter'
                          : 'Configure automated backup schedules for your database instances'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isInstancesLoading &&
                  filteredSchedules.map(row => {
                    const timing = parseCronDisplay(row.cron);
                    return (
                      <TableRow key={`${row.instanceName}-${row.name}`} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Icon icon="mdi:database" width={16} height={16} color="#757575" />
                            <Typography variant="body2">{row.instanceName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {timing}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {row.cron}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.storageName || row.backupClassName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.retentionCopies > 0 ? (
                            <Typography variant="body2">
                              {row.retentionCopies} {row.retentionCopies === 1 ? 'copy' : 'copies'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Unlimited
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Schedule">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSchedule(row)}
                            >
                              <Icon icon="mdi:pencil-outline" width={18} height={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Schedule">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteScheduleTarget(row)}
                            >
                              <Icon icon="mdi:delete-outline" width={18} height={18} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Backup Storages */}
        {activeTab === 2 && (
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
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading backup storages...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredStorages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
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
                      <TableCell align="right">
                        <Tooltip title="Delete Backup Storage">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteStorageTarget(storage)}
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
      </Box>

      {/* Dialog: Create On-Demand Backup */}
      <CreateOnDemandBackupDialog
        open={isOnDemandOpen}
        onClose={() => setIsOnDemandOpen(false)}
        availableInstances={backupEligibleInstances}
        backupStorages={backupStorages}
      />

      {/* Modal: Create or Edit Recurring Schedule */}
      <CreateScheduleModal
        open={isScheduleModalOpen}
        mode={scheduleModalMode}
        initialScheduleData={selectedScheduleData?.schedule}
        selectedInstanceName={selectedScheduleData?.instanceName}
        availableInstances={backupEligibleInstances}
        availableBackupClasses={backupClasses || []}
        backupStorages={backupStorages}
        onSave={handleSaveSchedule}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedScheduleData(null);
        }}
      />

      {/* Dialog: Confirm Delete Schedule */}
      <DeleteScheduleDialog
        open={Boolean(deleteScheduleTarget)}
        schedule={deleteScheduleTarget}
        instance={
          deleteScheduleTarget
            ? instances.find(inst => inst.metadata.name === deleteScheduleTarget.instanceName) || null
            : null
        }
        onClose={() => setDeleteScheduleTarget(null)}
      />

      {/* Dialog: Create Storage */}
      <CreateBackupStorageDialog
        open={isCreateStorageOpen}
        onClose={() => setIsCreateStorageOpen(false)}
      />

      {/* Dialog: Delete Backup Snapshot */}
      <DeleteBackupDialog
        open={Boolean(deleteTarget)}
        backup={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Dialog: Delete Backup Storage */}
      <DeleteBackupStorageDialog
        open={Boolean(deleteStorageTarget)}
        storage={deleteStorageTarget}
        onClose={() => setDeleteStorageTarget(null)}
      />
    </SectionBox>
  );
}
