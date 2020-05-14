import React from 'react';
import styles from './index.less';
import { Link } from 'umi';

export default (props: any) => {
  return (
    <div>
      <h1 className={styles.title}>Page index</h1>
      <p>
        <Link to="/overview">/overview</Link>
      </p>
      <p>
        <Link to="/project">/project</Link>
      </p>
      {props.children}
    </div>
  );
}
