/**
* @module helpers
*/
var fs = require('fs');
var util = require('util');
var colors = require('colors');
var yaml = require('../../node_modules/js-yaml');
var configFile = './.lifter/lifter.yml';

/**
* Function that reads the lifter.yml file
* @function
* @memberof module:helpers
*
*/
var readYAML = function() {
  var out;
  try {
    var content = fs.readFileSync(configFile);
    out = yaml.safeLoad(content);
  } catch (e) {
    console.log(e.code, e.path);
    if (e.code === 'ENOENT') {
      console.log('... config file does not exist, please run lifter config');
    }
    process.exit();
  }
  return out;
}

/**
* Function that writes to lifter.yml
* @function
* @memberof module:helpers
*
*/
var writeYAML = function(filepath,contents) {
  // make YAML file
  var yamlContents = yaml.safeDump(contents);

  //write YAML contents to filepath
  fs.writeFile(filepath,yamlContents,function(err) {
    if(err) {console.log(err);}
  });
};

/**
* Function that appends to an existing lifter.yml
* @function
* @memberof module:helpers
*
*/
var appendYAML = function(yamlKey,yamlValue) {
  var newYAMLEntry = yamlKey + ': ' + yamlValue + '\n';
  fs.appendFile(configFile, newYAMLEntry, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

/**
* Function that returns a string of the question and options (if any) for each prompt by the command line tool
* @function
* @param {string} text Question to be displayed by command line too
* @param {array} options Array of selections availale to the user for a given question
*/
var buildPromptDescription = function(text, options) {
  util.puts('> ' + text.green);
  if(options !== undefined) {
    for(var i=0;i<options.length;i++) {
      util.puts((i+1).toString().underline + '. '.underline + options[i].underline);
    }
  }
};

/**
* Function that returns boolean relating to whether user made a valid choice from options provided in command line
* @function
* @memberof module:helpers
* @param {object} obj Object containing all attributes of question and answer being validated
* @param {text} value String of selection made by user
*/
var validateResponse = function(obj,value) {
  console.log(obj.validation);
  console.log(value);

  if(obj.promptOptions) {
    return obj.validation({'value': value, options: obj.promptOptions});
  } else {
    return obj.validation({'value': value});
  }
};

module.exports = {
  readYAML: readYAML,
  writeYAML: writeYAML,
  appendYAML: appendYAML,
  buildPromptDescription: buildPromptDescription,
  validateResponse: validateResponse,
  configFile: configFile
}