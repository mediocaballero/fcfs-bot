const { Command } = require('discord-akairo');
const mps_admin = require('../util/mps_admin');
const sendmessage = require('../util/sendmessage');

class CloseWeekCommand extends Command {
  constructor() {
    super('closeweek', {
      aliases: ['closeweek', 'close'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: (message) => mps_admin(this.client, message)
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;

	sendmessage(message.channel, 'Cerrando semana...!');
	
	// Clear all AFKs
	let AFK_ROLE = 	message.guild.roles.cache.find(role => role.name === "AFK");

	sendmessage(message.channel, 'Eliminando roles AFK...');
	message.guild.members.cache.map( member=> {if (member.roles.cache.has(AFK_ROLE.id)) member.roles.remove(AFK_ROLE);});
	sendmessage(message.channel, 'Roles AFK eliminados!');

	// Open closed  queue rooms
	let HOSTING_ROLE = 	message.guild.roles.cache.find(role => role.name === "Hosting");

	sendmessage(message.channel, 'Cerrando salas de espera...');
	message.guild.channels.cache.filter(channel => channel.name.includes("espera")).map(channel => channel.updateOverwrite(
	HOSTING_ROLE.id,{CONNECT:false}
	));
	sendmessage(message.channel, 'Salas de espera cerradas!');
	
    return sendmessage(message.channel, 'Semana cerrada, hasta pronto!');
  }
}

module.exports = CloseWeekCommand;