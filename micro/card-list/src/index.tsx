import React from 'react';
import ReactDOM from 'react-dom';
import Component from './component';

let root: HTMLElement | null = null;

export async function bootstrap() {
  console.info('mini app bootstraped');
}

export async function mount(props: any) {
  root = document.querySelector(`#${props.containerId} #root`);
  if (root) {
    const { config = {} } = props;
    ReactDOM.render(<Component {...config} />, root);
  }
}

export async function update(props: any) {
  console.log(props);
}

export async function unmount() {
  if (root) {
    ReactDOM.unmountComponentAtNode(root);
  }
}
