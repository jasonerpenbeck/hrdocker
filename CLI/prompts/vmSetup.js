var validation = require('../validation/validation.js');

var vmPrompts = {
  existingOrNew: {
    promptText: 'Are you deploying to an existing azure vm or creating a new one?',
    promptOptions: ['Existing', 'New'],
    promptClass: 'existingOrNew',
    validation: validation.inOptions,
    nextClass:  function(answer) {
      if(answer === 'Existing') {
        return 'vmNameExisting';
      } else {
        return 'vmUsernameNew';
      }
    }
  },

  vmNameExisting: {
    promptText: 'What is your vm name?',
    promptClass: 'vmNameExisting',
    validation: validation.hasValue,
    nextClass: function() {return 'vmUsernameExisting';}
  },

  vmUsernameExisting: {
    promptText: 'What is your vm username?',
    promptClass: 'vmUsernameExisting',
    validation: validation.hasValue,
    nextClass: function() {return null;}
  },

  vmUsernameNew: {
    promptText: 'Please create a username for your Azure VM',
    promptClass: 'vmUsernameNew',
    validation: validation.hasValue,
    nextClass: function() {return 'vmPasswordNew';}
  },

  vmPasswordNew: {
    promptText: 'Please create a password for your Azure VM. Password should contain 8 characters, one lower case, one upper case character, a number, and a special character: !@#$%^&+=',
    promptClass: 'vmPasswordNew',
    validation: validation.isGoodPassword,
    nextClass: function() {return 'vmNameNew';}
  },

    vmNameNew: {
    promptText: 'Please select a name for your azure vm',
    promptClass: 'vmNameNew',
    validation: validation.hasValue,
    nextClass: function() {return null;}
  }
};

module.exports = {
  vmPrompts : vmPrompts
}