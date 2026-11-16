import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface PodSchedulingPolicyWidgetProps {
  node: UiComponentNode;
  value?: any;
  values?: Record<string, any>;
  onChange: (path: string, value: any) => void;
  disabled?: boolean;
  error?: string;
}

export type RuleType = 'Preferred' | 'Required';
export type AffinityType = 'Node affinity' | 'Pod affinity' | 'Pod anti-affinity';
export type AffinityOp = 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';

export interface Condition {
  id: string;
  key: string;
  op: AffinityOp;
  val: string;
}

export interface RuleGroup {
  id: string;
  ruleType: RuleType;
  type: AffinityType;
  weight?: number;
  topologyKey?: string;
  conditions: Condition[];
}

const requiresVal = (op: AffinityOp) => op !== 'Exists' && op !== 'DoesNotExist';

const RDSIDE = 'requiredDuringSchedulingIgnoredDuringExecution';
const PDSIDE = 'preferredDuringSchedulingIgnoredDuringExecution';

function toK8sAffinity(rules: RuleGroup[]) {
  if (!rules?.length) return undefined;
  const affinity: Record<string, any> = {};

  rules.forEach(r => {
    const exprs: any[] = [];
    for (const c of r.conditions) {
      const key = c.key.trim();
      if (!key) continue;

      if (!requiresVal(c.op)) {
        exprs.push({ key, operator: c.op });
      } else {
        const vals = c.val.split(',').map(v => v.trim()).filter(Boolean);
        exprs.push({ key, operator: c.op, values: vals });
      }
    }

    if (!exprs.length) return;

    if (r.type === 'Node affinity') {
      if (!affinity.nodeAffinity) {
        affinity.nodeAffinity = {};
      }
      const node = affinity.nodeAffinity;

      if (r.ruleType === 'Required') {
        if (!node[RDSIDE]) {
          node[RDSIDE] = { nodeSelectorTerms: [] };
        }
        node[RDSIDE].nodeSelectorTerms.push({ matchExpressions: exprs });
      } else {
        if (!node[PDSIDE]) {
          node[PDSIDE] = [];
        }
        node[PDSIDE].push({ weight: r.weight || 100, preference: { matchExpressions: exprs } });
      }
    } else {
      const term = {
        labelSelector: { matchExpressions: exprs },
        topologyKey: r.topologyKey ? r.topologyKey.trim() : 'kubernetes.io/hostname',
      };
      const key = r.type === 'Pod affinity' ? 'podAffinity' : 'podAntiAffinity';

      if (!affinity[key]) {
        affinity[key] = {};
      }
      const pod = affinity[key];

      if (r.ruleType === 'Required') {
        if (!pod[RDSIDE]) {
          pod[RDSIDE] = [];
        }
        pod[RDSIDE].push(term);
      } else {
        if (!pod[PDSIDE]) {
          pod[PDSIDE] = [];
        }
        pod[PDSIDE].push({ weight: r.weight || 100, podAffinityTerm: term });
      }
    }
  });

  return Object.keys(affinity).length ? affinity : undefined;
}

function fromK8sAffinity(aff?: any): RuleGroup[] {
  if (!aff) return [];
  const res: RuleGroup[] = [];

  aff.nodeAffinity?.[RDSIDE]?.nodeSelectorTerms?.forEach((term: any, i: number) => {
    res.push({
      id: `nr-${i}`,
      ruleType: 'Required',
      type: 'Node affinity',
      conditions: (term.matchExpressions || []).map((e: any, ci: number) => ({
        id: String(ci),
        key: e.key,
        op: (e.operator || 'In') as AffinityOp,
        val: (e.values || []).join(', '),
      })),
    });
  });

  aff.nodeAffinity?.[PDSIDE]?.forEach((it: any, i: number) => {
    res.push({
      id: `np-${i}`,
      ruleType: 'Preferred',
      type: 'Node affinity',
      weight: it.weight || 100,
      conditions: (it.preference?.matchExpressions || []).map((e: any, ci: number) => ({
        id: String(ci),
        key: e.key,
        op: (e.operator || 'In') as AffinityOp,
        val: (e.values || []).join(', '),
      })),
    });
  });

  const addPodRules = (t: 'Pod affinity' | 'Pod anti-affinity', obj: any, pfx: string) => {
    obj?.[RDSIDE]?.forEach((it: any, i: number) => {
      res.push({
        id: `${pfx}-r-${i}`,
        ruleType: 'Required',
        type: t,
        topologyKey: it.topologyKey,
        conditions: (it.labelSelector?.matchExpressions || []).map((e: any, ci: number) => ({
          id: String(ci),
          key: e.key,
          op: (e.operator || 'In') as AffinityOp,
          val: (e.values || []).join(', '),
        })),
      });
    });
    obj?.[PDSIDE]?.forEach((it: any, i: number) => {
      res.push({
        id: `${pfx}-p-${i}`,
        ruleType: 'Preferred',
        type: t,
        weight: it.weight || 100,
        topologyKey: it.podAffinityTerm?.topologyKey,
        conditions: (it.podAffinityTerm?.labelSelector?.matchExpressions || []).map((e: any, ci: number) => ({
          id: String(ci),
          key: e.key,
          op: (e.operator || 'In') as AffinityOp,
          val: (e.values || []).join(', '),
        })),
      });
    });
  };

  addPodRules('Pod affinity', aff.podAffinity, 'par');
  addPodRules('Pod anti-affinity', aff.podAntiAffinity, 'pan');
  return res;
}

export const PodSchedulingPolicyWidget: React.FC<PodSchedulingPolicyWidgetProps> = ({
  values,
  onChange,
  disabled = false,
}) => {
  const comps = ['engine', 'proxy'];
  const [activeTab, setActiveTab] = useState<string>('engine');
  const [rules, setRules] = useState<Record<string, RuleGroup[]>>(() => ({
    engine: fromK8sAffinity(values?.['spec.components.engine.schedulingPolicy']?.affinity),
    proxy: fromK8sAffinity(values?.['spec.components.proxy.schedulingPolicy']?.affinity),
  }));

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [ruleType, setRuleType] = useState<RuleType>('Required');
  const [affinityType, setAffinityType] = useState<AffinityType>('Node affinity');
  const [weight, setWeight] = useState<number>(100);
  const [topologyKey, setTopologyKey] = useState<string>('kubernetes.io/hostname');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', key: '', op: 'In', val: '' },
  ]);

  const activeRules = rules[activeTab] || [];

  const openDialog = () => {
    setRuleType('Required');
    setAffinityType('Node affinity');
    setWeight(100);
    setTopologyKey('kubernetes.io/hostname');
    setConditions([{ id: String(Date.now()), key: '', op: 'In', val: '' }]);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const addCondition = () => {
    setConditions(prev => [...prev, { id: String(Date.now()), key: '', op: 'In', val: '' }]);
  };

  const removeCondition = (id: string) => {
    setConditions(prev => (prev.length > 1 ? prev.filter(c => c.id !== id) : prev));
  };

  const updateCondition = (id: string, field: 'key' | 'op' | 'val', value: string) => {
    setConditions(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const saveRule = () => {
    const valid = conditions.filter(c => c.key.trim().length > 0);
    if (!valid.length) return;
    if (affinityType !== 'Node affinity' && !topologyKey.trim()) return;
    if (ruleType === 'Preferred' && (weight < 1 || weight > 100)) return;

    const newRule: RuleGroup = {
      id: `rule-${Date.now()}`,
      ruleType,
      type: affinityType,
      weight: ruleType === 'Preferred' ? weight : undefined,
      topologyKey: affinityType !== 'Node affinity' ? topologyKey.trim() : undefined,
      conditions: valid,
    };

    const nextRules = [...activeRules, newRule];
    const nextState = { ...rules, [activeTab]: nextRules };
    setRules(nextState);
    setDialogOpen(false);

    const k8sAffinity = toK8sAffinity(nextRules);
    onChange(`spec.components.${activeTab}.schedulingPolicy`, k8sAffinity ? { affinity: k8sAffinity } : undefined);
  };

  const deleteRule = (ruleId: string) => {
    const nextRules = activeRules.filter(r => r.id !== ruleId);
    const nextState = { ...rules, [activeTab]: nextRules };
    setRules(nextState);

    const k8sAffinity = toK8sAffinity(nextRules);
    onChange(`spec.components.${activeTab}.schedulingPolicy`, k8sAffinity ? { affinity: k8sAffinity } : undefined);
  };

  const hasEmptyKey = conditions.some(c => !c.key.trim());
  const isTopoKeyInvalid = affinityType !== 'Node affinity' && !topologyKey.trim();
  const isWeightInvalid = ruleType === 'Preferred' && (weight < 1 || weight > 100);
  const isAddDisabled = hasEmptyKey || isTopoKeyInvalid || isWeightInvalid;

  return (
    <Box sx={{ mt: 1 }}>
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2.5,
          minHeight: 38,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            minHeight: 38,
            py: 0.5,
          },
        }}
      >
        {comps.map(comp => {
          const count = (rules[comp] || []).length;
          return (
            <Tab
              key={comp}
              value={comp}
              label={count > 0 ? `${comp} (${count})` : comp}
            />
          );
        })}
      </Tabs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="body2" fontWeight={600}>
            Affinity
          </Typography>
          <Tooltip title="Configure node or pod affinity and anti-affinity rules.">
            <IconButton size="small" sx={{ p: 0.25 }}>
              <Icon icon="mdi:information-outline" width={16} />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          size="small"
          variant="text"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={openDialog}
          disabled={disabled}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add rule group
        </Button>
      </Box>

      {activeRules.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: 'action.hover',
            borderColor: 'divider',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No affinity rules yet. Add a rule group to get started.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {activeRules.map(r => (
            <Card
              key={r.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    size="small"
                    label={r.ruleType === 'Preferred' ? `Preferred (${r.weight || 100})` : 'Required'}
                    color={r.ruleType === 'Required' ? 'primary' : 'default'}
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {r.type}
                  </Typography>
                  {r.topologyKey && (
                    <Typography variant="caption" color="text.secondary">
                      topology: {r.topologyKey}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" flexWrap="wrap" gap={0.75}>
                  {r.conditions.map(c => (
                    <Chip
                      key={c.id}
                      size="small"
                      variant="outlined"
                      label={requiresVal(c.op) ? `${c.key} ${c.op} [${c.val}]` : `${c.key} ${c.op}`}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={() => deleteRule(r.id)}
                disabled={disabled}
                color="default"
              >
                <Icon icon="mdi:delete-outline" width={18} />
              </IconButton>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Add rule group to the {activeTab} component
          </Typography>
          <IconButton size="small" onClick={closeDialog}>
            <Icon icon="mdi:close" width={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Create a group of affinity rules to control how your database workloads are allocated across your system.
            Use it to enhance performance, improve resource management, or ensure high availability based on your deployment needs.
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={600}>
              Rule type
            </Typography>
            <ToggleButtonGroup
              value={ruleType}
              exclusive
              onChange={(_, val) => val && setRuleType(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                },
              }}
            >
              <ToggleButton value="Preferred">Preferred</ToggleButton>
              <ToggleButton value="Required">Required</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box display="flex" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="aff-type-label">Type</InputLabel>
              <Select
                labelId="aff-type-label"
                value={affinityType}
                label="Type"
                onChange={e => setAffinityType(e.target.value as AffinityType)}
              >
                <MenuItem value="Node affinity">Node affinity</MenuItem>
                <MenuItem value="Pod affinity">Pod affinity</MenuItem>
                <MenuItem value="Pod anti-affinity">Pod anti-affinity</MenuItem>
              </Select>
              <FormHelperText>How pods are scheduled</FormHelperText>
            </FormControl>

            {ruleType === 'Preferred' && (
              <TextField
                label="Weight"
                type="number"
                size="small"
                value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                error={weight < 1 || weight > 100}
                helperText={weight < 1 || weight > 100 ? 'weight must be between 1 and 100' : '1–100'}
                sx={{ minWidth: 160 }}
              />
            )}
          </Box>

          {affinityType !== 'Node affinity' && (
            <TextField
              label="Topology Key"
              size="small"
              fullWidth
              required
              value={topologyKey}
              onChange={e => setTopologyKey(e.target.value)}
              error={!topologyKey.trim()}
              helperText={!topologyKey.trim() ? 'Topology Key is required' : 'e.g. kubernetes.io/hostname'}
            />
          )}

          <Box>
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                Conditions
              </Typography>
              <Tooltip title="Match labels against pods or nodes.">
                <IconButton size="small" sx={{ p: 0.25 }}>
                  <Icon icon="mdi:information-outline" width={16} />
                </IconButton>
              </Tooltip>
            </Box>

            {hasEmptyKey && (
              <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>
                No label selector — matches no pods, has no effect
              </Alert>
            )}

            <Stack spacing={1.5}>
              {conditions.map(c => {
                const isKeyEmpty = !c.key.trim();
                return (
                  <Box key={c.id} display="flex" gap={1} alignItems="flex-start">
                    <TextField
                      label="Key"
                      size="small"
                      required
                      value={c.key}
                      onChange={e => updateCondition(c.id, 'key', e.target.value)}
                      error={isKeyEmpty}
                      helperText={isKeyEmpty ? 'Key is required' : undefined}
                      sx={{ flex: 1.2 }}
                    />
                    <FormControl size="small" sx={{ width: 140 }}>
                      <Select
                        value={c.op}
                        onChange={e => updateCondition(c.id, 'op', e.target.value as AffinityOp)}
                      >
                        <MenuItem value="In">In</MenuItem>
                        <MenuItem value="NotIn">NotIn</MenuItem>
                        <MenuItem value="Exists">Exists</MenuItem>
                        <MenuItem value="DoesNotExist">DoesNotExist</MenuItem>
                        <MenuItem value="Gt">Gt</MenuItem>
                        <MenuItem value="Lt">Lt</MenuItem>
                      </Select>
                    </FormControl>
                    {requiresVal(c.op) ? (
                      <TextField
                        placeholder={c.op === 'Gt' || c.op === 'Lt' ? 'e.g. 4' : 'e.g. ssd, nvme'}
                        size="small"
                        value={c.val}
                        onChange={e => updateCondition(c.id, 'val', e.target.value)}
                        sx={{ flex: 1.4 }}
                      />
                    ) : (
                      <Box sx={{ flex: 1.4 }} />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeCondition(c.id)}
                      disabled={conditions.length === 1}
                      sx={{ mt: 0.5 }}
                    >
                      <Icon icon="mdi:delete-outline" width={18} />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>

            <Button
              size="small"
              startIcon={<Icon icon="mdi:plus" />}
              onClick={addCondition}
              sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Add condition
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={saveRule}
            variant="contained"
            disabled={isAddDisabled}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

