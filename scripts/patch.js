const fs = require('fs');

const patchFile = (f, searchValue, replaceValue) => {
  fs.readFile(f, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(searchValue, replaceValue);

    fs.writeFile(f, result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });
}

patchFile('node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js'
  , /node: false/g,
  'node: {crypto: true, fs: "empty", tls: "empty", net: "empty"}')

// https://github.com/JoinColony/purser/issues/184
patchFile('node_modules/@ledgerhq/hw-transport-u2f/lib/TransportU2F.js',
  /var _hwTransport2 = _interopRequireDefault\(_hwTransport\);/g,
  'var _hwTransport2 = _interopRequireDefault(_hwTransport);\n\nvar regeneratorRuntime = require("@babel/runtime/regenerator");');