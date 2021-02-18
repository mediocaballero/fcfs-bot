const { Command } = require('discord-akairo');
const mps_admin = require('../util/mps_admin');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');

class InitWeekCommand extends Command {
  constructor() {
    super('initweek', {
      aliases: ['initweek', 'init'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: (message) => mps_admin(this.client, message)
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;

	sendmessage(message.channel, 'Iniciando semana...!');
	
	// Clear all Hosted

	let ANCHOR_ROLE = 	message.guild.roles.cache.find(role => role.name === "ancla");

	sendmessage(message.channel, 'Eliminando roles ancla...');
	message.guild.members.cache.map( member=> {if (member.roles.cache.has(ANCHOR_ROLE.id)) member.roles.remove(ANCHOR_ROLE);});
	sendmessage(message.channel, 'Roles ancla eliminados!');

	// Clear all AFKs

	let AFK_ROLE = 	message.guild.roles.cache.find(role => role.name === "AFK");

	sendmessage(message.channel, 'Eliminando roles AFK...');
	message.guild.members.cache.map( member=> {if (member.roles.cache.has(AFK_ROLE.id)) member.roles.remove(AFK_ROLE);});
	sendmessage(message.channel, 'Roles AFK eliminados!');

	// Open closed  queue rooms
	sendmessage(message.channel, '(pendiente)Salas abiertas!');
	
    return sendmessage(message.channel, 'Semana iniciada, GL&HF!');
  }
}

module.exports = InitWeekCommand;