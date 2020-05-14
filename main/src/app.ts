import './app.less';

function createExternals(externals: Record<string, any>) {
  Object.keys(externals).forEach(key => {
    const pkg = externals[key];
    Object.freeze(pkg);
    (window as any)[`_externals_${key}`] = pkg;
  });
}

export async function render(oldRender: Function) {
  // external 公共依赖
  createExternals({
    'react': require('react'),
    'react_dom': require('react-dom'),
    'react_router': require('react-router'),
    'react_router_dom': require('react-router-dom'),
    'antd': require('antd'),
    'moment': require('moment'),
  });
  oldRender();
}
