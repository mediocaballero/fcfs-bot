const { Command } = require('discord-akairo');
const sendmessage = require('../util/sendmessage');
const mps_helper = require('../util/mps_helper');

class MakePancakesCommand extends Command {
  constructor() {
    super('elpajas', {
      aliases: ['elpajas', 'pajas'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: message => mps_helper(this.client, message)
    });
  }

  async exec(message, args) {
    return sendmessage(message.channel, `─────▄▌▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀​▀▀▀▀▀▀▌
───▄▄██▌█ BEEP BEEP
▄▄▄▌▐██▌█ EL PAJAS HA LLEGADO
███████▌█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄​▄▄▄▄▄▄▌
▀(@)▀▀▀▀▀▀▀(@)(@)▀▀▀▀▀▀▀▀▀▀▀▀▀​▀▀▀▀(@)▀`);
  }
}

module.exports = MakePancakesCommand;