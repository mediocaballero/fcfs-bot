const { Command } = require('discord-akairo');
const mps_admin = require('../util/mps_admin');
const sendmessage = require('../util/sendmessage');

class KillBotCommand extends Command {
  constructor() {
    super('killbot', {
      aliases: ['killbot', 'kill'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: (message) => mps_admin(this.client, message),
      args: [
        {}
      ]
    });
  }

  async exec(message) {

	const fs = require('fs')
	
	const path = './db/fcfs.db'

	try {
		console.error('Deleting DB at ' + path);
	  // Delete DB
	  //fs.unlinkSync(path)
	} catch(err) {
	  console.error(err)
	}
	sendmessage(message.channel, `Borrado de la BBDD con éxito, el bot deberá ser reconfigurado`);
	process.exit(-1);
  }
}

module.exports = KillBotCommand;