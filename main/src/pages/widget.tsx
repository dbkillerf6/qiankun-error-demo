import React from 'react';
import Widget from '../components/Widget'

export default (props: any) => {
  return (
    <div key={props.match.params.id}>
      <Widget />
    </div>
  );
}
