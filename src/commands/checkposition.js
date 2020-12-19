const { Command, Flag } = require('discord-akairo');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');

class CheckPositionCommand extends Command {
  constructor() {
    super('checkposition', {
      aliases: ['checkposition', 'position', 'p'],
      split: 'quoted',
      channel: 'guild',
      args: [
        {
          id: 'member',
          type: (message, phrase) => {
            let member;

            if (phrase) {
              member = this.client.commandHandler.resolver.type('member')(message, phrase);
              if (!member) return Flag.fail({ reason: 'notAMember', phrase: phrase });
            } else {
              const guild = this.client.guilds.resolve(message.guild.id);
              member = guild.members.resolve(message.author.id);
            }
			            
            let voiceState = member.voice;
            if (!voiceState.channelID) return Flag.fail({ reason: 'memberNotInVoice', member });
        
            let ds = this.client.dataSource;
            let server = ds.servers[message.guild.id];
            let channelMonitor = server.channelMonitors[voiceState.channelID];
            if (!channelMonitor) return Flag.fail({ reason: 'memberNotInMonitoredChannel', member });

            return member;
          },
          otherwise: (msg, { failure }) => apf(this.client, msg, 'member', failure)
        },
 		{
          id: 'isSelf',
          type: (message, phrase) => {
			return !phrase;
		  }
		}
      ]
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];

    let voiceState = args.member.voice;

    let channelMonitor = server.channelMonitors[voiceState.channelID];

    let position = channelMonitor.queue.findIndex(user => user.id === args.member.id) + 1;

	let removedText = "";
	
	// Remove AFK role
	if (args.isSelf){
		const role = message.guild.roles.cache.find(role => role.name === "AFK");
		if(args.member.roles.cache.find(role => role.name === "AFK")) {
			await args.member.roles.remove(role);
			removedText = " y se le ha eliminado el estado AFK"
		}
	}
    channelMonitor.timeoutUpdateDisplay();
    ds.saveMonitor(channelMonitor.id);
    return sendmessage(message.channel, `La posición de ${args.member.displayName} en ---${channelMonitor.name}--- es: ${position} ${removedText}`);
  }
}

module.exports = CheckPositionCommand;
