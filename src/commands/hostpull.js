const { Command, Argument, Flag } = require('discord-akairo');
const mps_helper = require('../util/mps_helper');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');
const AFKChecker = require('../struct/afk_checker');

class HostPullCommand extends Command {
  constructor() {
    super('hostpull', {
      aliases: ['hostpull', 'hp'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: message => mps_helper(this.client, message),
      args: [
        {
          id: 'count',
          type: (message, phrase) => {
            if (!phrase) return Flag.fail({ reason: 'missingArg' });
            const n = parseFloat(phrase);
            if (isNaN(n)) return Flag.fail({ reason: 'notANumber', phrase });
            return n;
          },
          otherwise: (msg, { failure }) => apf(this.client, msg, 'count', failure)
        },
        {
          id: 'monitorChannel',
          type: 'monitorChannel',
          otherwise: (msg, { failure }) => apf(this.client, msg, 'monitorChannel', failure)
        }
      ]
    });
  }

  async exec(message, args) {
	if (!args.monitorChannel.initialised) {
      await args.monitorChannel.init();
    }

    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];
	let channelMonitor = args.monitorChannel;

    let callMessage = message.channel.send(`El host ${message.author} está llamando a ${args.count} miembros de ${channelMonitor.channel}... \n`);
	let afkRole = message.guild.roles.cache.find(role => role.name === "AFK");

	let calledUsers = channelMonitor.queue.filter(user => !message.guild.members.cache.get(user.id).roles.cache.has(afkRole.id)).slice(0,args.count);

    console.log('Host '+message.author.username +' calling '+args.count+' users: '+ calledUsers.map(u => u.username).join(','));
	if (calledUsers.length != 0) {
	    let membersMessage = message.channel.send('Habéis sido llamados: '+ calledUsers.map(u => u.toString()).join(',')+ '\nDebéis responder al host o seréis penalizados!').catch(err => console.log(`Failed!\n${err.message}`));
	
	    let top = calledUsers.map(user => message.guild.members.cache.get(user.id));
	
	    let afkChecker = new AFKChecker(this.client, server, channelMonitor, top);
	
	    let results = await afkChecker.run();
	} else {
		message.channel.send('Pero no hay miembros disponibles');
	}
    return;
  }
}

module.exports = HostPullCommand;