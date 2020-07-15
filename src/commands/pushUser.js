const { Command, Argument, Flag } = require('discord-akairo');
const sendmessage = require('../util/sendmessage');
const mps_mod = require('../util/mps_mod');
const apf = require('../util/arg_parse_failure');

class PushUserCommand extends Command {
  constructor() {
    super('pushuser', {
      aliases: ['pushuser', 'push'],
      split: 'quoted',
      userPermissions: (message) => mps_mod(this.client, message),
      channel: 'guild',
      args: [
        {
          id: 'member',
          type: 'queuedMember',
          otherwise: (msg, { failure }) => apf(this.client, msg, 'member', failure)
        },
        {
          id: 'positions',
          type: (message, phrase) => {
            if (!phrase) return Flag.fail({ reason: 'missingArg' });
            const n = parseFloat(phrase);
            if (isNaN(n)) return Flag.fail({ reason: 'notANumber', phrase });
            return n;
          },
          otherwise: (msg, { failure }) => apf(this.client, msg, 'position', failure)
        }
      ]
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];
    let channelMonitor = server.channelMonitors[args.member.voice.channelID];
	let oldPosition = channelMonitor.queue.findIndex(user => user.id === args.member.id);
	let newPosition =  (oldPosition+args.positions >= channelMonitor.queue.length?channelMonitor.queue.length-1:oldPosition+args.positions);
	
	sendmessage(message.channel, `Pushing ${args.member.displayName}'s a total of ${args.positions} positions in ${channelMonitor.name}, now at index ${oldPosition}, will be pushed to index ${newPosition}`);
	console.log('Pushing: %s - %s from index %d to %d', args.member.id, args.member.displayName,oldPosition,newPosition);

    channelMonitor.queue.splice(oldPosition, 1);
    channelMonitor.queue = [].concat(channelMonitor.queue.slice(0, newPosition), args.member.user, channelMonitor.queue.slice(newPosition));

    channelMonitor.timeoutUpdateDisplay();
    ds.saveMonitor(channelMonitor.id);

    return sendmessage(message.channel, `${args.member.displayName}'s was pushed ${args.positions} positions in ${channelMonitor.name}, and is now at index ${newPosition}`);
  }
}

module.exports = PushUserCommand;