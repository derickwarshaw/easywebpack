'use strict';
const expect = require('chai').expect;
const WebpackTool = require('webpack-tool');
const webpack = WebpackTool.webpack;
const merge = WebpackTool.merge;
const utils = require('../utils/utils');
const WebpackBaseBuilder = require('../lib/base');
const WebpackClientBuilder = require('../lib/client');
const path = require('path').posix;

// http://chaijs.com/api/bdd/
function createBuilder(config) {
  const builder = new WebpackBaseBuilder(config);
  builder.setBuildPath(path.join(__dirname, '../dist/loader'));
  builder.setPublicPath('/public');
  builder.setEntry({
    include: path.join(__dirname, '../test')
  });
  return builder;
}

function createClientBuilder(config) {
  const builder = new WebpackClientBuilder(config);
  builder.setBuildPath(path.join(__dirname, '../dist/loader'));
  builder.setPublicPath('/public');
  builder.setEntry({
    include: path.join(__dirname, '../test')
  });
  return builder;
}
function getLoaderByName(name, rules) {
  const loaderName = `${name}-loader`;
  return rules.find(rule => {
    return rule.use.some(loader => {
      return loaderName === loader || (typeof loader === 'object' && loader.loader === loaderName);
    });
  });
}
function getLoadersByName(name, rules) {
  const loaderName = `${name}-loader`;
  return rules.filter(rule => {
    return rule.use.some(loader => {
      return loaderName === loader || (typeof loader === 'object' && loader.loader === loaderName);
    });
  });
}
function getLoaderByTest(test, rules) {
  return rules.find(rule => {
    return rule.test.toString() === test.toString();
  });
}

describe('loader.test.js', () => {
  before(() => {
  });

  after(() => {
  });

  beforeEach(() => {
  });

  afterEach(() => {
  });

  describe('#webpack createWebpackLoader test', () => {
    it('should loader enable test', () => {
      const builder1 = createBuilder();
      const webpackConfig1 = builder1.create();
      const rules1 = webpackConfig1.module.rules;
      expect(getLoaderByName('eslint', rules1)).to.include.all.keys(['test', 'use']);
      expect(getLoaderByName('babel', rules1)).to.include.all.keys(['test', 'use']);
      expect(getLoaderByTest(/\.(woff2?|eot|ttf|otf)(\?.*)?$/, rules1)).to.include.all.keys(['test', 'use']);

      const builder2 = createBuilder({
        loaders: {
          eslint: false,
          babel: false,
          urlfont: false
        }
      });

      const webpackConfig2 = builder2.create();
      const rules2 = webpackConfig2.module.rules;
      expect(getLoaderByName('eslint', rules2)).to.equal(undefined);
      expect(getLoaderByName('babel', rules2)).to.be.undefined;
      expect(getLoaderByName(/\.(woff2?|eot|ttf|otf)(\?.*)?$/, rules2)).to.be.undefined;
    });

    it('should loader merge options test', () => {
      const config = {
        cache: false,
        loaders: {
          eslint: {
            options: {
              fix: true
            }
          },
          babel: {
            options: {
              presets: ['es2015', 'stage-2'],
              plugins: [
                'add-module-exports'
              ],
              comments: false
            }
          }
        }
      };
      const builder = createBuilder(config);

      const webpackConfig = builder.create();
      const rules = webpackConfig.module.rules;
      const eslint = getLoaderByName('eslint', rules);
      const babel = getLoaderByName('babel', rules);
      expect(eslint.use[0].options.fix).to.be.true;
      expect(babel.use[0].options).to.include.all.keys(['presets', 'plugins']);
      expect(babel.use[0].options.comments).to.be.false;
    });

    it('should loader use override test', () => {
      const config = {
        loaders: {
          babel: {
            use: ['babel-loader', 'eslint-loader']
          },
          options: {
            babel: {
              options:{
                presets: ['es2015', 'stage-2'],
                plugins: [
                  'add-module-exports'
                ],
                comments: false
              }
            },
            eslint: {
              options:{
                fix: true
              }
            }
          }
        }
      };
      const builder = createBuilder(config);
      const webpackConfig = builder.create();
      const rules = webpackConfig.module.rules;
      const loader = rules.find(rule => {
        return rule.use.length === 2 && rule.use[0].loader === 'babel-loader' && rule.use[1].loader === 'eslint-loader'
      });
      expect(!!loader).to.be.true;
      expect(loader.use[0].options).to.include.all.keys(['presets', 'plugins']);
      expect(loader.use[1].options.fix).to.be.true;

    });

    it('should merge loader test', () => {
      const config = {
        loaders:{
          vuehtml: {
            test: /\.html$/,
            loader: 'vue-html-loader',
            options:{
              test: true
            }
          }
        }
      };
      const builder = createBuilder(config);
      const webpackConfig = builder.create();
      const rules = webpackConfig.module.rules;
      const vuehtml = getLoaderByName('vue-html', rules);
      expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
      expect(vuehtml.use[0].options.test).to.true;
    });
  });
  it('should add extend loader test', () => {
    const builder = createBuilder({});
    builder.addLoader({
      vuehtml: {
        test: /\.html$/,
        loader: 'vue-html-loader',
        options:{
          test: true
        }
      }
    });
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    expect(vuehtml.use[0].options.test).to.true;
  });
  it('should add webpack loader test', () => {
    const builder = createBuilder({});
    builder.addLoader({
      test: /\.html$/,
      loader: 'vue-html-loader',
      options:{
        test: true
      }
    });
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    expect(vuehtml.use[0].options.test).to.true;
  });
  it('should add webpack loader use item string test', () => {
    const builder = createBuilder({});
    builder.addLoader({
      test: /\.html$/,
      use: ['vue-html-loader']
    });
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
  });

  it('should add webpack loader use item object test', () => {
    const builder = createBuilder({});
    builder.addLoader({
      test: /\.html$/,
      use: [{
        loader: 'vue-html-loader',
        options: {
          test: true
        }
      }]
    });
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    expect(vuehtml.use[0].options.test).to.true;
  });

  it('should merge array webpack loader test', () => {
    const builder = createBuilder({});
    builder.addLoader([{
      test: /\.html$/,
      use: [{
        loader: 'vue-html-loader',
        options: {
          test: true
        }
      }]
    }]);
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    expect(vuehtml.use[0].options.test).to.true;
  });

  it('should merge array extend loader test', () => {
    const builder = createBuilder({});
    builder.addLoader([{
      vuehtml: {
        test: /\.html$/,
        loader: 'vue-html-loader',
        options:{
          test: true
        }
      }
    }]);
    const webpackConfig = builder.create();
    const rules = webpackConfig.module.rules;
    const vuehtml = getLoaderByName('vue-html', rules);
    expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    expect(vuehtml.use[0].options.test).to.true;
  });
  

  describe('#webpack feature loader test', () => {
    it('should postcss-loader default config', () => {
      const builder = createBuilder();
      const webpackConfig = builder.create();
      const cssLoader = getLoaderByName('css', webpackConfig.module.rules);
      const postcssLoader = cssLoader.use.find(loader => {
        return loader.loader === 'postcss-loader';
      });
      expect(postcssLoader.options.sourceMap).to.be.undefined;
    });

    it('should postcss-loader devtool config', () => {
      const builder = createClientBuilder({ devtool: 'source-map'});
      const webpackConfig = builder.create();
      const cssLoader = getLoaderByName('css', webpackConfig.module.rules);

      const postcssLoader = cssLoader.use.find(loader => {
        return loader.loader === 'postcss-loader';
      });
      expect(postcssLoader.options.sourceMap).to.be.true;
    });

    it('should postcss-loader override devtool config', () => {
      const builder = createClientBuilder({
        devtool: 'source-map', loaders: {
          options: {
            postcss: {
              sourceMap: false
            }
          }
        }
      });
    
      const webpackConfig = builder.create();
      const cssLoader = getLoaderByName('css', webpackConfig.module.rules);

      const postcssLoader = cssLoader.use.find(loader => {
        return loader.loader === 'postcss-loader';
      });
      expect(postcssLoader.options.sourceMap).to.be.false;
    });
  });

  describe('#webpack feature url loader test', () => {
    it('should url-loader default config', () => {
      const builder = createBuilder();
      const webpackConfig = builder.create();
      const urlLoaders = getLoadersByName('url', webpackConfig.module.rules);
      expect(urlLoaders.length).to.equal(3);
    });
    it('should url-loader default config', () => {
      const builder = createBuilder({
        loaders:{
          urlmedia:false,
          urlfont: false,
          urlimage: {
            options:{
              limit: 10000
            }
          }
        }
      });
      const webpackConfig = builder.create();
      const urlLoader = getLoaderByName('url', webpackConfig.module.rules);
      expect(urlLoader.use[0].options.limit).to.equal(10000);
    });
  });
  describe('#webpack babel loader test', () => {
    it('should babel-loader default config', () => {
      const cacheDirectory = utils.getCacheLoaderInfoPath('babel-loader', 'dev');
      const builder = createBuilder();
      const webpackConfig = builder.create();
      const babelLoader = getLoaderByName('babel', webpackConfig.module.rules);
      expect(babelLoader.use.length).to.equal(1);
      expect(babelLoader.use[0].options.cacheDirectory).to.equal(cacheDirectory);
    });
  });
  describe('#webpack config cache test', () => {
    it('should config cache false config', () => {
      const cacheDirectory = utils.getCacheLoaderInfoPath('babel-loader', 'dev');
      const builder = createBuilder({
        cache: false
      });
      const webpackConfig = builder.create();
      const babelLoader = getLoaderByName('babel', webpackConfig.module.rules);
      expect(babelLoader.use.length).to.equal(1);
      expect(babelLoader.use[0].options.cacheDirectory).to.be.undefined
    });
    it('should config cache undefined config', () => {
      const cacheDirectory = utils.getCacheLoaderInfoPath('babel-loader', 'dev');
      const builder = createBuilder({
        cache: undefined
      });
      const webpackConfig = builder.create();
      const babelLoader = getLoaderByName('babel', webpackConfig.module.rules);
      expect(babelLoader.use.length).to.equal(1);
      expect(babelLoader.use[0].options.cacheDirectory).to.equal(cacheDirectory);
    });
  });
});
