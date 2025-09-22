import {
  Activity,
  Building,
  Calculator,
  Dash,
  Diagram3,
  Gear,
  GraphUp,
  GraphUpArrow,
  Grid,
  Plus,
  QuestionCircle,
  X,
} from 'react-bootstrap-icons';

import type { Action, ConfigNode } from '@/types/config.types';

// Helper function to get localized name
export const getLocalizedName = (node: ConfigNode | Action, defaultLanguage?: string): string => {
  if (!node) return '';

  // Try default language first if provided
  if (defaultLanguage) {
    const localizedName = node[`name_${defaultLanguage}` as keyof typeof node] as string;
    if (localizedName) return localizedName;
  }

  // Fallback to common language variants
  return (
    node.name || node.name_en || node.name_fi || node.name_es || node.id // Ultimate fallback to ID
  );
};

// Helper function to get localized description
export const getLocalizedDescription = (
  node: ConfigNode | Action,
  defaultLanguage?: string
): string => {
  if (!node) return '';

  // Try default language first if provided
  if (defaultLanguage) {
    const localizedDesc = node[`description_${defaultLanguage}` as keyof typeof node] as string;
    if (localizedDesc) return localizedDesc;
  }

  // Fallback to common language variants
  return (
    node.description || node.description_en || node.description_fi || node.description_es || ''
  );
};

// Helper function to get icon for node type
export const NodeTypeIcon = (props: { nodeType: string | undefined; size?: number }) => {
  const { nodeType, size } = props;
  if (!nodeType) return <QuestionCircle color="#9e9e9e" size={size} />;

  const type = nodeType.toLowerCase();

  // Simple mathematical operations
  if (type.includes('additive')) return <Plus color="#2196f3" size={size} />;
  if (type.includes('multiplicative') || type.includes('multiplylast'))
    return <X color="#9c27b0" size={size} />;
  if (type.includes('subtractive')) return <Dash color="#f44336" size={size} />;
  if (type.includes('divisive')) return <Calculator color="#ff9800" size={size} />;

  // Action types
  if (type.includes('action')) return <Gear color="#4caf50" size={size} />;
  if (type.includes('cumulative')) return <GraphUp color="#03a9f4" size={size} />;

  // Improvement types
  if (type.includes('improvement')) return <GraphUpArrow color="#009688" size={size} />;

  // Emission and activity types
  if (type.includes('emission') || type.includes('activity'))
    return <Activity color="#ff5722" size={size} />;

  // Sector-specific types
  if (type.includes('sector')) return <Building color="#795548" size={size} />;

  // Generic types
  if (type.includes('generic')) return <Diagram3 color="#607d8b" size={size} />;
  if (type.includes('dimensional')) return <Grid color="#9c27b0" size={size} />;

  // Default fallback
  return <QuestionCircle color="#9e9e9e" size={size} />;
};

// Helper function to get color scheme for node type
export const getNodeTypeColor = (nodeType: string) => {
  const type = nodeType.toLowerCase();

  if (type.includes('additive')) return { bg: '#e3f2fd', border: '#2196f3' };
  if (type.includes('multiplicative') || type.includes('multiplylast'))
    return { bg: '#f3e5f5', border: '#9c27b0' };
  if (type.includes('subtractive')) return { bg: '#ffebee', border: '#f44336' };
  if (type.includes('divisive')) return { bg: '#fff3e0', border: '#ff9800' };
  if (type.includes('action')) return { bg: '#e8f5e8', border: '#4caf50' };
  if (type.includes('improvement')) return { bg: '#e0f2f1', border: '#009688' };
  if (type.includes('emission')) return { bg: '#fce4ec', border: '#e91e63' };
  if (type.includes('generic')) return { bg: '#f5f5f5', border: '#607d8b' };

  return { bg: '#fafafa', border: '#bdbdbd' };
};

export const getNodeTypeLabel = (nodeType: string | undefined) => {
  if (!nodeType) return '-';

  const type = nodeType.toLowerCase();

  if (type.includes('genericaction')) return 'Action';
  if (type.includes('genericnode')) return 'Node';
  if (type.includes('emissionfactor')) return 'Emission Factor';

  if (type.includes('additive')) return 'Additive';
  if (type.includes('multiplicative') || type.includes('multiplylast')) return 'Multiplicative';
  if (type.includes('subtractive')) return 'Subtractive';
  if (type.includes('divisive')) return 'Divisive';
  if (type.includes('action')) return 'Action';

  if (type.includes('finland')) return 'Finland';

  return nodeType;
};
