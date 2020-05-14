import React from 'react';
import { Row, Col, Pagination } from 'antd';

import styles from './index.module.less';

const CardList: React.FC<any> = props => {
  const CardItem = props.item;
  const { dataSource = [], pagination = {}, colProps = {} } = props;
  return (
    <div className={styles['omni-card-list']}>
      <Row gutter={[16, 16]} className={styles['list-row']}>
        {dataSource.map((item: any, index: number) => (
          <Col key={index} {...colProps} className={styles['list-col']}>
            {CardItem ? <CardItem {...item} index={index} /> : null}
          </Col>
        ))}
      </Row>
      {pagination.total || dataSource.length ? (
        <Pagination
          className={styles.pagination}
          defaultCurrent={pagination.defaultCurrent}
          total={pagination.total || dataSource.length}
        />
      ) : null}
    </div>
  );
};

export default CardList;
