export { AdminSidebar, ADMIN_NAV_GROUPS, type NavItemConfig, type NavGroupConfig } from './AdminSidebar';
export { AdminTopbar } from './AdminTopbar';
export { PageHeader } from './PageHeader';
export { KPIStatCard } from './KPIStatCard';
export { FilterBar } from './FilterBar';
export { AdminDataTable, DataTable, type ColumnDef, type AdminDataTableProps } from './AdminDataTable';
export { DetailDrawer, type DetailDrawerProps } from './DetailDrawer';
export { ActivityTimeline, type ActivityTimelineItem, type ActivityTimelineProps } from './ActivityTimeline';
export { StatusBadge, type StatusBadgeVariant, type StatusBadgeProps } from './StatusBadge';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { LoadingState, type LoadingStateProps } from './LoadingState';
export { ErrorState, type ErrorStateProps } from './ErrorState';
export { FormSection, type FormSectionProps } from './FormSection';

export const formatCOP = (valor: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor || 0));
