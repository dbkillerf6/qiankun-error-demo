import { loadMicroApp } from 'qiankun';
import React from 'react';

const dataSource = [
  { name: 1 },
];

export default class App extends React.Component {

  microApp: any = null;
  id = `app-${Math.floor(Math.random() * 1000000)}`;

  componentDidMount() {
    this.microApp = loadMicroApp(
      {
        name: 'card-list',
        entry: 'http://localhost:3001',
        container: '#' + this.id,
        props: {
          containerId: this.id,
          config: {
            colProps: { span: 6 },
            dataSource,
            item: (props: any) => <div>{props.name}</div>
          }
        }
      }
    );
  }

  componentWillUnmount() {
    this.microApp.unmount();
  }

  render() {
    return <div id={this.id}></div>;
  }
}
