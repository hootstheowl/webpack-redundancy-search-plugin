# Webpack Redundancy Search Plugin

Generates a JSON file listing any unused modules within your application's source code.

## Installation

```shell
npm install webpack-redundancy-search-plugin --save-dev
```
Or, with yarn:
```shell
yarn add webpack-redundancy-search-plugin --dev
```

## Usage

In your webpack configuration file:

1. Require the plugin

  ```js
  const UnusedModulePlugin = require('webpack-redundancy-search-plugin');
  ```

2. Add the plugin to the `plugins` array:

  ```js
  plugins: [
    new UnusedModulePlugin({
      directories: [
        path.resolve('./app/scripts'),
      ],
      exclude: [
        path.resolve('./app/scripts/Billing/'),
        path.resolve('./app/scripts/*'),
      ],
      extensions: ['.js', '.jsx'],
      output: './unusedModules.json',
    })
  ]
  ```
   
## Options

- `directories` (Array): A list of directories to search for redundancies in
- `exclude` (Array): A list of directories where the plugin should ignore redundancies
- `extensions` (Array): A list of allowed extensions for components (default: `['.js']`)
- `outputPath` (String): The full path to the generated JSON file (default './unusedModuleReport.json'),
- `reactLocation` (String): If your project is a react (or react-like) project, you can define location of your framework library to allow the plugin to identify components (default: './node_modules/react/index.js')

## Example Output

```
{
  "totalModules": 200,
  "totalUnusedModules": 9,
  "unusedModulesList": [
    "./app/scripts/UI/Form/EmailInput.js",
    "./app/scripts/UI/Form/PhoneNumberInput.js",
    "./app/scripts/UI/Form/index.js",
    "./app/scripts/UI/MasterDetail/DetailView.js",
    "./app/scripts/UI/MasterDetail/index.js",
    "./app/scripts/UI/VSection.js",
  ],
  "excludedModulesList": [
    "./app/scripts/Billing/BankForm.js",
    "./app/scripts/Billing/CreditCardForm.js",
    "./app/scripts/Billing/InvoiceRoute.js",
    "./app/scripts/main.js"
  ]
}
```
