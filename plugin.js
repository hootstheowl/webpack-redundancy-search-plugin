const { resolve } = require('path');
const { writeFile } = require('fs');
const {
  getChunkModulesDependencyList,
  getAllFileLocationsForDirectoriesList,
  getRedudantModulesFromInfoList,
  getRedundancyExclusionsList,
} = require('./util');

class UnusedModuleReportPlugin {
  constructor(options) {
    this.options = {
      directories: [],
      extensions: ['.js'],
      exclude: [],
      output: './unusedModuleReport.json',
      reactLocation: '/node_modules/react/index.js',
      ...options,
    };
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      compilation.plugin('additional-assets', callback => {
        let allModulesInfoList = [];
        compilation.chunks.forEach(chunk => {
          allModulesInfoList = allModulesInfoList.concat(
            getChunkModulesDependencyList(chunk, this.options),
          );
        });
        const allFileLocationsList = getAllFileLocationsForDirectoriesList(
          this.options,
        );
        const redundantModulesList = getRedudantModulesFromInfoList(
          allModulesInfoList,
          allFileLocationsList,
          this.options.extensions,
        );
        const excludedModulesList = getRedundancyExclusionsList(
          redundantModulesList,
          this.options,
        );
        const outputLocation = resolve(this.options.output);
        writeFile(
          outputLocation,
          JSON.stringify({
            totalModules: allModulesInfoList.length,
            totalUnusedModules: redundantModulesList.length,
            unusedModulesList: redundantModulesList.filter(moduleLocation => (
              excludedModulesList.includes(moduleLocation) === false
            )),
            excludedModulesList,
          }, null, 2),
          err => {
            if (!err) {
              console.log(`Unused module report generated. Report saved in ${outputLocation}`);
            }
          },
        );
        callback();
      });
    });
  }
}

module.exports = UnusedModuleReportPlugin;
