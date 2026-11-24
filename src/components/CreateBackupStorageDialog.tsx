import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React, { useState } from 'react';
import { BackupStorage } from '../crd/BackupStorage';
import { BackupStorageClass } from '../crd/BackupStorageClass';

export interface CreateBackupStorageDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultNamespace?: string;
}

export function CreateBackupStorageDialog({
  open,
  onClose,
  onCreated,
  defaultNamespace = 'default',
}: CreateBackupStorageDialogProps) {
  const [namespacesList] = K8s.ResourceClasses.Namespace.useList();
  const [storageClassesList] = BackupStorageClass.useList();

  const availableNamespaces = namespacesList?.map(n => n.metadata.name) || [defaultNamespace];
  const storageClasses = storageClassesList && storageClassesList.length > 0
    ? storageClassesList
    : [
        {
          metadata: { name: 's3' },
          displayName: 'S3-compatible object storage',
          description:
            'Amazon S3 and S3-compatible object stores such as MinIO, Ceph RGW and the GCS interoperability endpoint.',
        },
      ];

  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState(defaultNamespace);
  const [selectedClassName, setSelectedClassName] = useState('s3');
  const [bucket, setBucket] = useState('');
  const [prefix, setPrefix] = useState('');
  const [region, setRegion] = useState('');
  const [endpointURL, setEndpointURL] = useState('');
  const [implementation, setImplementation] = useState('');
  const [forcePathStyle, setForcePathStyle] = useState(false);
  const [authMode] = useState('AccessKey');
  const [credentialsSource, setCredentialsSource] = useState<'enter' | 'existing'>('enter');
  const [customSecretName, setCustomSecretName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [insecureSkipVerify, setInsecureSkipVerify] = useState(true);
  const [caSecretName, setCaSecretName] = useState('');
  const [caSecretKey, setCaSecretKey] = useState('ca.crt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = storageClasses.find(c => c.metadata?.name === selectedClassName) || storageClasses[0];

  const resetForm = () => {
    setName('');
    setNamespace(defaultNamespace);
    setSelectedClassName('s3');
    setBucket('');
    setPrefix('');
    setRegion('');
    setEndpointURL('');
    setImplementation('');
    setForcePathStyle(false);
    setCredentialsSource('enter');
    setCustomSecretName('');
    setAccessKey('');
    setSecretKey('');
    setShowAccessKey(false);
    setShowSecretKey(false);
    setInsecureSkipVerify(true);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const isFormValid =
    name.trim() !== '' &&
    bucket.trim() !== '' &&
    region.trim() !== '' &&
    endpointURL.trim() !== '' &&
    (credentialsSource === 'existing'
      ? customSecretName.trim() !== ''
      : accessKey.trim() !== '' && secretKey.trim() !== '');

  const defaultSecretName = `backup-storage-${name.trim() || ''}-credentials`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const targetNs = namespace.trim() || 'default';
    const finalSecretName = customSecretName.trim() || defaultSecretName;

    const payload = {
      apiVersion: 'backup.openeverest.io/v1alpha1',
      kind: 'BackupStorage',
      metadata: {
        name: name.trim(),
        namespace: targetNs,
      },
      spec: {
        backupStorageClassRef: { name: selectedClass.metadata?.name || 's3' },
        location: {
          objectStore: {
            bucket: bucket.trim(),
            ...(prefix.trim() ? { prefix: prefix.trim() } : {}),
          },
        },
        parameters: {
          region: region.trim(),
          endpointURL: endpointURL.trim(),
          forcePathStyle,
          ...(implementation ? { implementation } : {}),
        },
        authentication: {
          mode: authMode,
          credentialsSecretRef: {
            name: finalSecretName,
          },
        },
        tls: {
          insecureSkipVerify,
          ...(!insecureSkipVerify && caSecretName.trim()
            ? {
                ca: {
                  secretKeyRef: {
                    name: caSecretName.trim(),
                    key: caSecretKey.trim() || 'ca.crt',
                  },
                },
              }
            : {}),
        },
      },
    };

    try {
      if (credentialsSource === 'enter') {
        const secretPayload = {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: finalSecretName,
            namespace: targetNs,
            labels: {
              'app.kubernetes.io/managed-by': 'openeverest',
            },
          },
          type: 'Opaque',
          stringData: {
            AWS_ACCESS_KEY_ID: accessKey.trim(),
            AWS_SECRET_ACCESS_KEY: secretKey.trim(),
          },
        };

        try {
          await K8s.ResourceClasses.Secret.apiEndpoint.post(secretPayload);
        } catch (secErr: any) {
          if (secErr?.status !== 409) {
            console.warn('Secret creation warning:', secErr);
          }
        }
      }

      await BackupStorage.apiEndpoint.post(payload);
      setIsSubmitting(false);
      resetForm();
      onCreated?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to create backup storage');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span" fontWeight={600}>
            Add backup storage
          </Typography>
          <IconButton size="small" onClick={handleClose} disabled={isSubmitting}>
            <Icon icon="mdi:close" width={20} height={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Name"
                placeholder="Enter storage display name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="namespace-select-label">Namespace *</InputLabel>
                <Select
                  labelId="namespace-select-label"
                  label="Namespace *"
                  value={namespace}
                  onChange={e => setNamespace(e.target.value)}
                  disabled={isSubmitting}
                >
                  {availableNamespaces.map(ns => (
                    <MenuItem key={ns} value={ns}>
                      {ns}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="storage-type-label">Type</InputLabel>
                <Select
                  labelId="storage-type-label"
                  label="Type"
                  value={selectedClassName}
                  onChange={e => setSelectedClassName(e.target.value)}
                  disabled={isSubmitting || storageClasses.length <= 1}
                >
                  {storageClasses.map(sc => (
                    <MenuItem key={sc.metadata?.name || 's3'} value={sc.metadata?.name || 's3'}>
                      {sc.displayName || sc.metadata?.name || 'S3-compatible object storage'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedClass.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', px: 0.5 }}>
                  {selectedClass.description}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Bucket"
                placeholder="my-backups"
                value={bucket}
                onChange={e => setBucket(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Prefix"
                helperText="Optional path within the bucket"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Region"
                placeholder="us-east-1"
                value={region}
                onChange={e => setRegion(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Endpoint URL"
                placeholder="https://s3.us-east-1.amazonaws.com"
                helperText="An http:// URL uses plain HTTP"
                value={endpointURL}
                onChange={e => setEndpointURL(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="implementation-label">Implementation</InputLabel>
                <Select
                  labelId="implementation-label"
                  label="Implementation"
                  value={implementation}
                  onChange={e => {
                    const val = e.target.value;
                    setImplementation(val);
                    if (val === 'minio' || val === 'ceph') {
                      setForcePathStyle(true);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <MenuItem value="">
                    <em>None (Standard S3)</em>
                  </MenuItem>
                  <MenuItem value="aws">Amazon S3</MenuItem>
                  <MenuItem value="minio">MinIO</MenuItem>
                  <MenuItem value="ceph">Ceph RGW</MenuItem>
                  <MenuItem value="gcs">Google Cloud Storage (S3 interoperability)</MenuItem>
                  <MenuItem value="other">Other S3-compatible</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={forcePathStyle}
                    onChange={e => setForcePathStyle(e.target.checked)}
                    disabled={isSubmitting}
                    size="small"
                  />
                }
                label="Force path-style URLs"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="auth-mode-label">Authentication</InputLabel>
                <Select
                  labelId="auth-mode-label"
                  label="Authentication"
                  value={authMode}
                  disabled
                >
                  <MenuItem value="AccessKey">AccessKey</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                Credentials
              </Typography>
              <RadioGroup
                row
                value={credentialsSource}
                onChange={e => setCredentialsSource(e.target.value as 'enter' | 'existing')}
              >
                <FormControlLabel
                  value="enter"
                  control={<Radio size="small" />}
                  label="Enter credentials"
                  disabled={isSubmitting}
                />
                <FormControlLabel
                  value="existing"
                  control={<Radio size="small" />}
                  label="Use an existing Secret"
                  disabled={isSubmitting}
                />
              </RadioGroup>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Credentials Secret name"
                placeholder={defaultSecretName}
                helperText={`The Secret the credentials are stored in. Defaults to ${defaultSecretName}.`}
                value={customSecretName}
                onChange={e => setCustomSecretName(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            {credentialsSource === 'enter' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Access key ID"
                    type={showAccessKey ? 'text' : 'password'}
                    value={accessKey}
                    onChange={e => setAccessKey(e.target.value)}
                    disabled={isSubmitting}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={() => setShowAccessKey(!showAccessKey)}
                          >
                            <Icon icon={showAccessKey ? 'mdi:eye-off' : 'mdi:eye'} width={18} height={18} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Secret access key"
                    type={showSecretKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    disabled={isSubmitting}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={() => setShowSecretKey(!showSecretKey)}
                          >
                            <Icon icon={showSecretKey ? 'mdi:eye-off' : 'mdi:eye'} width={18} height={18} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                TLS
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={insecureSkipVerify}
                    onChange={e => setInsecureSkipVerify(e.target.checked)}
                    disabled={isSubmitting}
                    size="small"
                  />
                }
                label="Skip TLS certificate verification"
              />
              {insecureSkipVerify ? (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 1.5,
                    backgroundColor: '#fff8e1',
                    color: '#663c00',
                    '& .MuiAlert-icon': { color: '#e65100' },
                  }}
                >
                  OpenEverest won't validate your server's certificate, leaving HTTPS connections insecure and vulnerable to man-in-the-middle attacks.
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CA Secret name"
                      helperText="The Secret containing the CA certificate"
                      value={caSecretName}
                      onChange={e => setCaSecretName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CA Secret key"
                      placeholder="ca.crt"
                      value={caSecretKey}
                      onChange={e => setCaSecretKey(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
