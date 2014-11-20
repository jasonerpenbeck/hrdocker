var fs = require('fs');
var exec = require('child_process').exec;
// var prompt = require('../../node_modules/prompt');
var rl = require('../helpers/readlineModule.js');
var vmSetup = require('../prompts/vmSetup.js');
var yaml = require('../../node_modules/js-yaml');
var helpers = require('../helpers/helpers.js');
var colors = require('colors');
var configFile = "./.lifter/lifter.yml";

var vmAnswers = {};

//check if user has azure-cli installed
var checkAzure = function(){
  exec('npm list -g --depth=0 | grep azure-cli', function(err, stdout, stderr){
    if(/azure-cli/.test(stdout)) {
      console.log("Azure-CLI found, opening Azure Management Portal in default browser...".green);
      checkSubscription();
    } else {
      console.log("Exiting lifter...\n\nPlease install the azure command line tool and rerun lifter deploy:\nnpm install -g azure-cli".white);
    }
  });
}

//check if azure subscription is connected
var checkSubscription = function() {
  exec('azure account show', function(err, stdout, stderr){
    if(/There is no current subscription/.test(stdout)){
      console.log("Azure subscription not connected");
      loginAzure();
    } else {
      askVMQuestion(vmSetup.vmPrompts.existingOrNew);
    }
  });
};

var askVMQuestion = function(obj) {
// uses util.puts to render question and options for each question
  helpers.buildPromptDescription(obj.promptText, obj.promptOptions);
  rl.readCommandLine.question('', function(text) {

    // Assign value as either entered text or the the text of the option selected
    var value = (!obj.promptOptions) ? text : obj.promptOptions[parseInt(text) - 1];

    if(helpers.validateResponse(obj,value)) {
      vmAnswers[obj.promptClass] = value;
//       console.log(value);

      var yamlKey;
      if (obj.promptClass === 'vmUsernameExisting' || obj.promptClass === 'vmUsernameNew') {
//           helpers.appendYAML('vmUsername',value);

      } else if (obj.promptClass === 'vmNameExisting' || obj.promptClass === 'vmNameNew') {

        if(obj.promptClass === 'vmNameNew') {
          console.log('Going to createAzure');

          // secondary validation to insure that VM Name is not already in use
          createAzureVM(vmAnswers);
        } else {
//           helpers.appendYAML('vmName',value);
        }
      } else {
          // Add nothing to YAML
      }

        // nextEvent handles decision trees
      var nextEvent = obj.nextClass(value);

      if(nextEvent !== null) {
          askVMQuestion(vmSetup.vmPrompts[nextEvent]);
      } else {
          // Close Command Line
        rl.readCommandLine.close();

        fs.readFile(configFile, 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          var replace = data.replace(/vmNameHere/g, vmAnswers.vmNameNew).replace(/vmUsernameHere/g, vmAnswers.vmUsernameNew);

          fs.writeFile(configFile, replace, 'utf8', function (err) {
             if (err) {
              return console.log(err);
             } else {
               console.log("Writing deploy script...");
               updateDeployScript();
             }
          });
        });
//           updateDeployScript();
      }

    } else {
      // Error messages are in the appropriate validation functions
      askVMQuestion(obj);
    }
  });



};

//asks users if they are deploying to a new vm or to an existing one
/*
var whichVM = function(){
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();

  prompt.get(vmSetupQs.existingOrNew, function(err, result){
    if(result.select === "existing"){
      getVMInfo();
    } else if (result.select === "new"){
      setupAzureVM();
    }
  });
}
*/

//ask the user to login to azure and connect their subscription
var loginAzure = function() {
  exec('azure account download', function(err, stdout, stderr){
    if(err){
      console.log("ERR: ", err);
    } else {
      console.log("Please complete the following before continuing\n\n"+
      "1. Sign into the Azure Management Portal in the browser that was opened\n"+
      "2. A .publishsettings file will be downloaded, remember its location\n"+
      "3. Run the following command: azure account import .publishsettings < .publishsettings file location>\n"+
      "4. Rerun lifter deploy".white);
    }
  });
}

//asks user to create vm credentials and grabs ubuntu image
/*
var setupAzureVM = function() {

  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();

  prompt.get(vmSetupQs.vmSetup, function(err,result){
    credentials = [result.vm, result.username, result.password];
    createAzureVM(credentials);
  });
}
*/


//create an Azure VM with the Ubuntu image
var createAzureVM = function(obj) {

var ubuntuImage = "b39f27a8b8c64d52b05eac6a62ebad85__Ubuntu-14_04-LTS-amd64-server-20140724-en-us-30GB";
  var command = 'azure vm docker create -e 22 -l "West US" '+ obj.vmNameNew +' "' + ubuntuImage + '" ' + obj.vmUsernameNew + ' ' + obj.vmPasswordNew;

  exec(command, function(err, stdout, stderr){
    if(err){
      if(/The specified DNS name is already taken|already exists/.test(stderr)){
        console.log(('A VM with the dns "' + obj.vmNameNew + '" already exists.').red);
        setupAzureVM();
      } else {
        console.log("ERR: ", err);
      }
    } else {
        console.log('Azure VM "'+ obj.vmNameNew + '" created');

/*
        helpers.appendYAML('vmName',obj.vmNameNew);
        console.log("Writing deploy script...");
        updateDeployScript();
*/



      fs.readFile(configFile, 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }

        var replace = data.replace(/vmNameHere/g, obj.vmNameNew).replace(/vmUsernameHere/g, obj.vmUsernameNew);

        fs.writeFile(configFile, replace, 'utf8', function (err) {
           if (err) {
            return console.log(err);
           } else {
             console.log("Writing deploy script...");
             updateDeployScript();
           }
        });
      });


    }
  });
}

//updates deploy.sh file to include the correct docker images
var updateDeployScript = function() {

  var yamlContent = helpers.readYAML();
  var image = yamlContent.username + "/" + yamlContent.repoName + ":latest";

  fs.readFile('./.lifter/deploy.sh', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    var replace = data.replace(/dockerRepoName/g, image);

    fs.writeFile('./.lifter/deploy.sh', replace, 'utf8', function (err) {
       if (err) {
        return console.log(err);
       } else {
         console.log("Deploy script complete.");
         sendDeployScript();
       }
    });
  });
}

//copies deploy script into vm
var sendDeployScript = function(){

  var yamlContent = helpers.readYAML();
  var userNameForDeploy = yamlContent.vmUsername || yamlContent.vmUsernameNew;
  var vmNameForDeploy = yamlContent.vmName || yamlContent.NameNew;
  var sshPath = "ssh " + userNameForDeploy + "@" + vmNameForDeploy + ".cloudapp.net";

  console.log("\nPlease run the following commands:\n\n" +
              "1. Send the deploy script to your vm: " +sshPath+ " 'cat > ./.lifter/deploy.sh; scp; cat /home/" +userNameForDeploy+ "' < deploy.sh\n"+
              "You will be prompted for the vm's password after running this command. If this is your first time ssh-ing into the vm,\n"+
              "you will need to respond 'yes' when asked about authenticating the host\n\n"+
              "2. ssh into your vm: "+sshPath+"\n\n"+
              "3. Run the script inside your vm: sudo sh deploy.sh\n");
};

module.exports = {
  checkAzure: checkAzure
}
