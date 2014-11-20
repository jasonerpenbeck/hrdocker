var fs = require('fs');
var util = require('util');
var yaml = require('../../node_modules/js-yaml');
var rl = require('../helpers/readlineModule.js');
var helpers = require('../helpers/helpers.js');
var colors = require('colors');
var configSetup = require('../prompts/configSetup.js');
var configFile = "./.lifter/lifter.yml";

/**
* Object containing all user input from prompt and an entry with the current working directory
* @object
*/
var containerProperties = {
  currentWorkingDir: process.cwd(),
  vmName: "vmNameHere",
  vmUsername: "vmUsernameHere"
};


/**
* Function that prompts questions on command line, writes answers to containerProperties objects, and builds YML file when complete
* THIS NEEDS TO BE MORE MODULAR
* @function
* @param {object} obj Object containing all attributes of prompted question
*/
var askConfigQuestion = function(obj,callback) {
  // uses util.puts to render question and options for each question
  helpers.buildPromptDescription(obj.promptText, obj.promptOptions);
  rl.readCommandLine.question('', function(text) {

    // Assign value as either entered text or the the text of the option selected
    var value = (!obj.promptOptions) ? text : obj.promptOptions[parseInt(text) - 1];

      if(helpers.validateResponse(obj,value)) {
        containerProperties[obj.promptClass] = value;

        // nextEvent handles decision trees
        var nextEvent = obj.nextClass(value);

        if(nextEvent !== null) {
          askConfigQuestion(configSetup.configPrompts[nextEvent]);
        } else {
            console.log('Good work.  Run lifter init to build a container.');

            // Close Command Line
            rl.readCommandLine.close();

            // Run Callback When All Relevant Prompts Have Been Sufficiently Answered
            helpers.writeYAML(configFile,containerProperties);
        }
      } else {
          // Error messages are in the appropriate validation functions
          askConfigQuestion(obj);
      }
  });
};

module.exports = {
  askConfigQuestion: askConfigQuestion
}
