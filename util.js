const path = require('path');
const isEmpty = require('lodash.isempty');
const readdirRecursive = require('fs-readdir-recursive');

/**
 * Determines whether or not all given conditions are true
 * @param {Array} conditionsList - List of conditions
 * @returns {Boolean} True if all conditions are strictly true, false otherwise
 */
function allConditionsTrue(conditionsList = []) {
  return conditionsList.every(condition => condition === true);
}

/**
 * Determines whether or not a given module is a react component
 * @param {Object} param0 - Webpack module info object
 * @param {String} param0.resource @alias moduleLocation - The location of the given module
 * @param {String} reactLocation - The file location for React within the app dependencies
 * @returns {Boolean} True if module is react component, false otherwise
 */
function isModuleReactComponent({ resource: moduleLocation = '' }, reactLocation) {
  return moduleLocation.indexOf(reactLocation) >= 0;
}

/**
 * Determines whether or not a given module is within specified directories list
 * @param {Object} param0 - Webpack module info object
 * @param {String} param0.resource @alias moduleLocation - The location of the given module
 * @param {Array} directories - List of module directories within the app
 * @param {Array} extensions - List of valid file extentions used for modules within the app
 * @returns {Boolean} True if module is in one of given directories, false otherwise
 */
function isModuleInDirectories(
  { resource: moduleLocation = '' },
  directories = [],
  extensions = [],
) {
  return allConditionsTrue([
    isEmpty(moduleLocation) === false,
    directories.some(dir => (moduleLocation.indexOf(dir) === 0)),
    extensions.includes(path.extname(moduleLocation)),
  ]);
}

/**
 * Retrieves list of module dependency information from given webpack build chunk
 * @param {Object} param0 - Webpack build chunk object
 * @param {Array} param0.modules @alias chunkModules - Modules within webpack build chunk object
 * @param {Object} param1 - Plugin options object
 * @param {Array} param1.directories @alias directories - List of module directories within the app
 * @param {Array} param1.extensions @alias extensions - List of file valid extentions used by
 *  modules within the app
 * @param {String} param1.reactLocation @alias reactLocation - The file location for React within
 *  the app dependencies
 */
function getChunkModulesDependencyList(
  { modules: chunkModules = [] },
  { directories, extensions, reactLocation },
) {
  if (isEmpty(chunkModules) === true) {
    return [];
  }
  return chunkModules
    .filter(chunkModule => (
      isModuleInDirectories(chunkModule, directories, extensions)
    ))
    .map(({ resource, dependencies }) => ({
      moduleLocation: resource,
      dependencyLocationsList: (dependencies || [])
        .filter(({ module: depModule }) => (
          depModule
          && depModule.resource
          && (
            isModuleReactComponent(depModule, reactLocation)
            || isModuleInDirectories(depModule, directories, extensions)
          )
        ))
        .map(({ module: depModule }) => depModule.resource),
    }));
}

/**
 * Retrieves all file locations within a given directory
 * @param {String} directory - Directory within application
 * @param {Array} extensions - List of valid file extentions used for modules within the app
 * @returns {Array} List of all file locations within given directory
 */
function getAllFileLocationsForDirectory(directory, extensions = []) {
  if (isEmpty(directory) === true) {
    return [];
  }
  return readdirRecursive(directory)
    .filter(fileLoction => (
      extensions.includes(path.extname(fileLoction))
    ))
    .map(fileLocation => `${directory}/${fileLocation}`);
}

/**
 * Retrieves all file locations within a given list of directories
 * @param param0 - Plugin options object
 * @param {Array} parm0.directories @alias directories - List of directories within application
 * @param {Array} param0.extensions @alias extensions - List of valid file extentions used for
 *  modules within the app
 * @returns {Array} List of all file locations within the given directories
 */
function getAllFileLocationsForDirectoriesList({ directories = [], extensions = [] }) {
  return [].concat(
    ...directories.map(dir => (
      getAllFileLocationsForDirectory(dir, extensions)
    )),
  );
}

/**
 * Compares module info from webpack build against list of file locations taken from the
 * to retrieve a list of unused modules file locations
 * @param {Array} modulesInfoList - List of module info via getChunkModulesDependencyList
 * @param {Array} fileLocationsList - List of file locations within project via
 *  getAllFileLocationsForDirectoriesList
 * @returns {Array} List of redundant(unused) file locations within the application
 */
function getRedudantModulesFromInfoList(
  modulesInfoList = [],
  fileLocationsList = [],
) {
  let allDependencyLocationsList = [];
  modulesInfoList.forEach(({ dependencyLocationsList }) => {
    allDependencyLocationsList = allDependencyLocationsList.concat(dependencyLocationsList);
  });
  return fileLocationsList.filter(fileLocation => (
    allDependencyLocationsList.includes(fileLocation) === false
  ));
}

/**
 * Build RegEx to include file extensions
 * @param {Array} extensions - File extensions to include in regex search
 * @returns {String) RegEx String
 */
function getRegexExtensions(extensions = []) {
  return extensions.map(fileExtension => (`\\${fileExtension}`)).join('|');
}

/**
 * Builds RegEx to replace wildcard rules in string
 * @param {Array} extensions - File extensions to include in regex search
 * @returns {String} RegEx String
 */
function getWildcardRegex(extensions = []) {
  return `/([\\w,\\d,\\s,-,_]+)(?:${getRegexExtensions(extensions)})`;
}

/**
 * Gets excluded files from found redundant modules list based on exclude options
 * @param {Array} redundantModulesList - Array of redundant module locations in application
 * @param {Object} param1 - Plugin options object
 * @param {Array} param1.exclude @alias exclude - List of exclusions while searching
 * @param {Array} param1.extensions @alias extensions - List of file extensions to search for
 * @returns {Array} List of file locations to be excluded from redundantModulesList
 */
function getRedundancyExclusionsList(
  redundantModulesList = [],
  { exclude, extensions },
) {
  const exclusionsSearchRulesList = exclude.filter(exclusion => (
    exclusion.indexOf('*') === exclusion.length - 1
  ));
  const exclusionsLocationsList = exclude.filter(exclusion => (
    exclusionsSearchRulesList.includes(exclusion) === false
  ));
  const exclusionsRegexList = exclusionsSearchRulesList.map(searchRule => (
    searchRule.replace('/*', getWildcardRegex(extensions))
  ));
  return redundantModulesList.filter(moduleLocation => {
    if (exclusionsRegexList.some(regex => (
      moduleLocation.search(regex) >= 0
    ))) {
      return true;
    }
    return exclusionsLocationsList.some(exclusionLocation => (
      moduleLocation.search(exclusionLocation) >= 0
    ));
  });
}

module.exports = {
  getAllFileLocationsForDirectoriesList,
  getChunkModulesDependencyList,
  getRedudantModulesFromInfoList,
  getRedundancyExclusionsList,
};
