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
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CreationSummarySidebar } from '../components/CreationSummarySidebar';
import { ProviderSelectorGrid } from '../components/ProviderSelectorGrid';
import { ScheduledBackupsStep } from '../components/ScheduledBackupsStep';
import { WidgetRenderer } from '../components/widgets';
import { BackupClass } from '../crd/BackupClass';
import { BackupStorage } from '../crd/BackupStorage';
import { Instance } from '../crd/Instance';
import { Provider } from '../crd/Provider';
import { resolveTopologyUi, SelectOption } from '../schema/uiSchema';
import {
  FlattenedSchedule,
  getCompatibleBackupClasses,
  PitrConfigMap,
} from '../utils/backupSchedules';
import { buildInstancePayload, extractDefaultValues } from '../utils/buildInstance';
import { routes } from '../utils/navigation';

export function CreateDatabasePage() {
  const history = useHistory();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedTopology, setSelectedTopology] = useState<string>('');
  const [mainStep, setMainStep] = useState<number>(0);
  const [configStep, setConfigStep] = useState<number>(0);
  const [instanceName, setInstanceName] = useState<string>('');
  const [namespace, setNamespace] = useState<string>('default');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<FlattenedSchedule[]>([]);
  const [backupClassName, setBackupClassName] = useState<string>('');
  const [pitrMap, setPitrMap] = useState<PitrConfigMap>({});

  const [backupClasses] = BackupClass.useList();
  const [allBackupStorages] = BackupStorage.useList();
   
  const backupStorages = useMemo(() => {
    const ns = namespace.trim() || 'default';
    return (allBackupStorages || []).filter(bs => bs.metadata.namespace === ns);
  }, [allBackupStorages, namespace]);

  const compatibleClasses = useMemo(() => {
    return getCompatibleBackupClasses(backupClasses || [], selectedProvider?.metadata.name || '');
  }, [backupClasses, selectedProvider]);

  const hasBackupStep = compatibleClasses.length > 0;

  useEffect(() => {
    setSchedules([]);
    setBackupClassName('');
    setPitrMap({});
  }, [selectedProvider]);

  const availableTopologies = useMemo(() => {
    if (!selectedProvider || !selectedProvider.spec?.uiSchema) return [];
    return Object.keys(selectedProvider.spec.uiSchema);
  }, [selectedProvider]);

  useEffect(() => {
    if (availableTopologies.length > 0) {
      if (!selectedTopology || !availableTopologies.includes(selectedTopology)) {
        setSelectedTopology(availableTopologies[0]);
      }
    } else {
      setSelectedTopology('');
    }
  }, [availableTopologies, selectedTopology]);

  const topologySchema = useMemo(() => {
    if (!selectedProvider || !selectedTopology) return undefined;
    return resolveTopologyUi(selectedProvider.spec as any, selectedTopology);
  }, [selectedProvider, selectedTopology]);

  useEffect(() => {
    if (topologySchema && selectedProvider) {
      const defaults = extractDefaultValues(topologySchema);
      const defaultVer =
        selectedProvider.defaultVersion || selectedProvider.spec?.versions?.[0]?.name;
      if (defaultVer && !defaults['spec.version']) {
        defaults['spec.version'] = defaultVer;
      }
      setFormValues(defaults);
      setConfigStep(0);
    }
  }, [topologySchema, selectedProvider]);

  const customOptions = useMemo<Record<string, SelectOption[]>>(() => {
    const result: Record<string, SelectOption[]> = {};
    if (!selectedProvider) return result;

    const versions = selectedProvider.spec?.versions || [];
    result['spec.version'] = versions.map(v => ({
      label: v.name,
      value: v.name,
    }));

    return result;
  }, [selectedProvider]);

  const sectionsOrder = topologySchema?.sectionsOrder || [];

  const wizardSteps = useMemo(() => {
    const steps: Array<{ key: string; label: string; type: 'basic' | 'backup' | 'section' }> = [];
    steps.push({ key: 'basic', label: 'Basic Information', type: 'basic' });
    if (hasBackupStep) {
      steps.push({ key: 'backups', label: 'Backups', type: 'backup' });
    }
    for (const secKey of sectionsOrder) {
      const sec = topologySchema?.sections?.[secKey];
      steps.push({ key: secKey, label: sec?.label || secKey, type: 'section' });
    }
    return steps;
  }, [hasBackupStep, sectionsOrder, topologySchema]);

  const currentStep = wizardSteps[configStep];
  const currentSection = currentStep?.type === 'section'
    ? topologySchema?.sections?.[currentStep.key]
    : undefined;

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleFieldChange = (path: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [path]: value,
    }));
  };

  const handleNextFromEngineGrid = () => {
    if (!selectedProvider) return;
    setMainStep(1);
    setConfigStep(0);
  };

  const handleNextSection = () => {
    if (currentStep?.type === 'basic') {
      if (!instanceName.trim()) {
        setSubmitError('Database instance name is required.');
        return;
      }
      setSubmitError(null);
    }
    if (configStep < wizardSteps.length - 1) {
      setConfigStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (configStep > 0) {
      setConfigStep(prev => prev - 1);
    } else {
      setMainStep(0);
    }
  };

  const handleSubmit = async () => {
    if (!instanceName.trim()) {
      setSubmitError('Database instance name is required.');
      return;
    }

    if (!selectedProvider || !selectedTopology) {
      setSubmitError('Provider and topology must be selected.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildInstancePayload({
        name: instanceName.trim(),
        namespace: namespace.trim() || 'default',
        providerName: selectedProvider.metadata.name,
        topologyName: selectedTopology,
        version: formValues['spec.version'],
        formValues,
        topologySchema,
        schedules,
        backupClassName,
        pitrMap,
      });

      await Instance.apiEndpoint.post(payload);
      history.push(routes.databases());
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to create database instance.');
      setIsSubmitting(false);
    }
  };

  return (
    <SectionBox>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Create Database
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {mainStep === 0
            ? 'Select a database engine to deploy in your cluster'
            : `Configure your ${selectedProvider?.metadata.name || ''} instance`}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {mainStep === 0 ? (
        <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <ProviderSelectorGrid
              selectedProviderName={selectedProvider?.metadata.name}
              onSelect={handleSelectProvider}
            />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={4}
              pt={2}
              borderTop={1}
              borderColor="divider"
            >
              <Button
                variant="outlined"
                onClick={() => history.push(routes.databases())}
              >
                Cancel
              </Button>

              <Box display="flex" alignItems="center" gap={2}>
                {selectedProvider && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: <strong>{selectedProvider.metadata.name}</strong>
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedProvider}
                  onClick={handleNextFromEngineGrid}
                >
                  Next: Configure Database
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {wizardSteps.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={configStep} alternativeLabel>
                {wizardSteps.map((step, idx) => (
                  <Step key={step.key} completed={configStep > idx}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  {currentStep?.type === 'basic' ? (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Basic Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Set the basic identity and placement of your database.
                      </Typography>

                      <Box display="flex" flexDirection="column" gap={2.5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Database Name"
                          required
                          value={instanceName}
                          onChange={e => {
                            setInstanceName(e.target.value);
                            if (submitError) setSubmitError(null);
                          }}
                          placeholder="e.g. production-db"
                        />

                        <TextField
                          fullWidth
                          size="small"
                          label="Namespace"
                          required
                          value={namespace}
                          onChange={e => setNamespace(e.target.value)}
                          placeholder="default"
                        />

                        <FormControl fullWidth size="small" disabled={availableTopologies.length <= 1}>
                          <InputLabel id="topology-label">Topology</InputLabel>
                          <Select
                            labelId="topology-label"
                            label="Topology"
                            value={selectedTopology}
                            onChange={e => setSelectedTopology(String(e.target.value))}
                          >
                            {availableTopologies.map(t => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  ) : currentStep?.type === 'backup' ? (
                    <Box sx={{ mb: 4 }}>
                      <ScheduledBackupsStep
                        namespace={namespace.trim() || 'default'}
                        provider={selectedProvider?.metadata.name || ''}
                        schedules={schedules}
                        onSchedulesChange={setSchedules}
                        backupClassName={backupClassName}
                        onBackupClassNameChange={setBackupClassName}
                        pitrMap={pitrMap}
                        onPitrMapChange={setPitrMap}
                        backupStorages={backupStorages}
                      />
                    </Box>
                  ) : currentSection ? (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {currentSection.label || currentStep?.key}
                      </Typography>
                      {currentSection.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {currentSection.description}
                        </Typography>
                      )}

                      <Box display="flex" flexDirection="column" gap={1.5}>
                        {(currentSection.componentsOrder && currentSection.componentsOrder.length > 0
                          ? currentSection.componentsOrder
                          : Object.keys(currentSection.components || {})
                        ).map(compKey => {
                          const node = currentSection.components?.[compKey];
                          if (!node) return null;
                          return (
                            <WidgetRenderer
                              key={node.path || node.id || compKey}
                              node={node}
                              values={formValues}
                              onChange={handleFieldChange}
                              disabled={isSubmitting}
                              customOptions={customOptions}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  ) : null}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                    pt={2}
                    borderTop={1}
                    borderColor="divider"
                  >
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      {configStep === 0 ? '< Change Engine' : 'Back'}
                    </Button>

                    <Box display="flex" gap={1.5}>
                      <Button
                        variant="outlined"
                        onClick={() => history.push(routes.databases())}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>

                      {configStep < wizardSteps.length - 1 ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleNextSection}
                          disabled={isSubmitting}
                        >
                          Next Section
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !instanceName.trim()}
                          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                        >
                          {isSubmitting ? 'Creating Database...' : 'Create Database'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <CreationSummarySidebar
                provider={selectedProvider}
                topology={selectedTopology}
                instanceName={instanceName}
                namespace={namespace}
                topologySchema={topologySchema}
                formValues={formValues}
                schedules={schedules}
                hasBackupStep={hasBackupStep}
                pitrMap={pitrMap}
              />
            </Grid>
          </Grid>
        </Box>

      )}
    </SectionBox>
  );
}
