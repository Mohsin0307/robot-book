import React, { useState } from 'react';
import styles from './styles.module.css';

interface InteractiveExampleProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function InteractiveExample({
  title,
  description,
  children,
}: InteractiveExampleProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.interactiveExample}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.icon}>{isExpanded ? '▼' : '▶'}</span>
        <span className={styles.title}>{title}</span>
      </div>
      {description && <div className={styles.description}>{description}</div>}
      {isExpanded && <div className={styles.content}>{children}</div>}
    </div>
  );
}
