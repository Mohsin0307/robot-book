import React from 'react';
import styles from './styles.module.css';

interface CalloutProps {
  type?: 'note' | 'tip' | 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
}

export default function Callout({
  type = 'note',
  title,
  children,
}: CalloutProps): JSX.Element {
  const icon = {
    note: '📝',
    tip: '💡',
    warning: '⚠️',
    danger: '🚨',
    info: 'ℹ️',
  };

  return (
    <div className={`${styles.callout} ${styles[type]}`}>
      {title && (
        <div className={styles.calloutTitle}>
          <span className={styles.icon}>{icon[type]}</span>
          <span>{title}</span>
        </div>
      )}
      <div className={styles.calloutContent}>{children}</div>
    </div>
  );
}
