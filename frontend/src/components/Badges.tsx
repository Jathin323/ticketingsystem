import type { Priority, Status } from '../types';
import { statusClass } from '../utils';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status--${statusClass(status)}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`priority priority--${priority}`}>{priority}</span>;
}
