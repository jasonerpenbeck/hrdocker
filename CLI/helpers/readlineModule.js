var readline = require('readline');

/**
* Function that creates instance of readline.createInterface, which makes asking questions slightly easier and handles certain keystrokes properly
* @function
* @param {object} obj Object initializing input and output
*/
var readCommandLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

module.exports = {
  readCommandLine: readCommandLine
}