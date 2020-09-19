const { Command, Flag } = require('discord-akairo');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');

class setAFKCommand extends Command {
  constructor() {
    super('setAFK', {
      aliases: ['setAFK', 'a'],
      split: 'quoted',
      channel: 'guild',
      args: [
        {
          id: 'member',
          type: (message, phrase) => {
            let member;

            const guild = this.client.guilds.resolve(message.guild.id);
            member = guild.members.resolve(message.author.id);
			// Set AFK role
			const role = guild.roles.cache.find(role => role.name === "AFK");

			if(member.roles.cache.find(role => role.name === "AFK")) {
  				member.roles.remove(role);	
			} else {
				member.roles.add(role);				
			} 
	

            return member;
          },
          otherwise: (msg, { failure }) => apf(this.client, msg, 'member', failure)
        }
      ]
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];
    let channelMonitor = server.channelMonitors[args.member.voice.channelID];

	const afkPositionsPenalty = 4;
	
	if (args.member.roles.cache.find(role => role.name === "AFK")){
		// Set as not AFK
		channelMonitor.timeoutUpdateDisplay();
    	return sendmessage(message.channel, `Se ha restablecido el estado de  ${args.member.displayName} como no AFK`);		
	} else {
		// Set as AFK
		let oldPosition = channelMonitor.queue.findIndex(user => user.id === args.member.id);
		let newPosition =  (oldPosition+afkPositionsPenalty >= channelMonitor.queue.length?channelMonitor.queue.length-1:oldPosition+afkPositionsPenalty);
		
		console.log('AFK Pushing: %s - %s from index %d to %d', args.member.id, args.member.displayName,oldPosition,newPosition);
	
	    channelMonitor.queue.splice(oldPosition, 1);
	    channelMonitor.queue = [].concat(channelMonitor.queue.slice(0, newPosition), args.member.user, channelMonitor.queue.slice(newPosition));
		channelMonitor.timeoutUpdateDisplay();
    	return sendmessage(message.channel, `Se ha establecido el estado de  ${args.member.displayName} como AFK y se le ha empujado como penalización ${afkPositionsPenalty} posiciones hasta la ${newPosition+1}`);		
	}
  }
}

module.exports = setAFKCommand;
