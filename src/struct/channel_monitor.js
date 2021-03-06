const { Util } = require('discord.js');
const AFKCheckScheduler = require('./afk_check_scheduler');

class ChannelMonitor {
  constructor(client, data) {
    this.client = client;

    this.guildID = data.guildID;
    this.id = data.id;

    this.displayChannel = data.displayChannel;
    this.displayMessage = data.displayMessage;

    this.rejoinWindow = data.rejoinWindow;
    this.displaySize = data.displaySize;
    this.afkCheckDuration = data.afkCheckDuration;

    this.lastAfkChecked = {};
    this.removalTimers = {};

    this.snowflakeQueue = data.snowflakeQueue;
    this.automatic = data.automatic;
    this.autoOutput = data.autoOutput;

    this.initialised = false;
    this.initialising = false;
  }

  async init() {
    if (this.initialised || this.initialising) return;
    this.initialising = true;

    this.channel = this.client.channels.resolve(this.id);
    this.name = this.channel.name;

    this.displayChannelName = this.client.channels.resolve(this.displayChannel).name;

    await this.populateQueue(this.snowflakeQueue);

    this.updateDisplay();

    this.afkCheckScheduler = new AFKCheckScheduler(this.client, this, this.automatic);
    this.afkCheckScheduler.start();

    this.initialised = true;
    this.initialising = false;
  }

  async populateQueue(snowflakeQueue) {
    // Get rid of users who aren't in the channel anymore
    snowflakeQueue = snowflakeQueue.filter(id => this.channel.members.get(id) !== undefined);

    this.queue = [];

    // Get users from queue data
    await Promise.all(snowflakeQueue.map(snowflake => this.client.users.fetch(snowflake))).then(users => {
      this.queue = users.filter(Boolean);
    });

    // If there's users missing from the queue, add them in a random order
    if (this.queue.length < this.channel.members.size) {
      let currentlyConnected = this.channel.members;
      let rest = currentlyConnected.random(currentlyConnected.size).filter(user => !this.queue.includes(user.id));

      for (let guildMember of rest) {
        this.queue.push(guildMember.user);
      }
    }

    this.queue = this.queue.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    this.client.dataSource.saveMonitor(this.id);
  }
	
  get message() {
    let guild = this.client.guilds.resolve(this.guildID);
	let role = guild.roles.cache.find(role => role.name === "AFK");
    let title = `**${this.name}:**`;
	let order = 0;
	
	// Count AFK users
	let calledUsers = this.queue.filter(user => !guild.members.cache.get(user.id).roles.cache.some(role => role.name === "AFK")).slice(0, this.displaySize);
	let splitPoint = this.queue.findIndex(user => user === calledUsers[calledUsers.length-1])+1;

    let top = this.queue.slice(0, splitPoint).map((user, index) => `${guild.members.cache.get(user.id).roles.cache.get(role.id)?"~AFK..":++order}. ${guild.members.cache.get(user.id).displayName} (${user.tag})`).join('\n');
	let rest = this.queue.slice(splitPoint).map((user, index) => `${guild.members.cache.get(user.id).roles.cache.get(role.id)?"~AFK..":++order}. ${guild.members.cache.get(user.id).displayName} (${user.tag})`).join('\n');

    return title +'\n Se enviará chequeo AFK a ('+this.displaySize+' primeros no-AFK):'+ '\n```\n' + (top || '<EMPTY>')+ '\n```' +'\nNo se enviará chequeo AFK a:'+ '\n```\n' + (rest || '<EMPTY>')+ '\n```';
	//return title +'\n Se enviará chequeo AFK a ('+this.displaySize+' primeros no-AFK):'+ '\n\n' + (top || '<EMPTY>')+ '\n' +'\nNo se enviará chequeo AFK a:'+ '\n\n' + (rest || '<EMPTY>')+ '\n';
  }



  async addUserToQueue(userID) {
    if (!this.initialised) await this.init();
    if (this.removalTimers[userID]) {
      clearTimeout(this.removalTimers[userID]);
      delete this.removalTimers[userID];
    } else {
      this.queue.push(this.client.users.resolve(userID));
      this.timeoutUpdateDisplay();
      this.client.dataSource.saveMonitor(this.id);
    }
  }

  timeoutRemoveUserFromQueue(userID) {
    let removeIndex = this.queue.findIndex(el => el.id === userID);
    if (removeIndex === -1) return;
    this.removalTimers[userID] = setTimeout(() => this.removeUserFromQueue(userID), this.rejoinWindow);
  }

  async removeUserFromQueue(userID) {
    if (!this.initialised) await this.init();
    let removeIndex = this.queue.findIndex(el => el.id === userID);
    if (removeIndex === -1) return;
    this.queue.splice(removeIndex, 1);
    this.timeoutUpdateDisplay();
    this.client.dataSource.saveMonitor(this.id);
    delete this.removalTimers[userID];
  }

  pushBackUserInQueue(userID, positions) {

	let oldPosition = this.queue.findIndex(user => user.id === userID);
	let newPosition =  (oldPosition+positions >= this.queue.length?this.queue.length-1:oldPosition+positions);
	let member = this.queue[oldPosition];
	
	console.log('Pushing: %s - %s from index %d to %d', member.id, member.displayName,oldPosition,newPosition);

    this.queue.splice(oldPosition, 1);
    this.queue = [].concat(this.queue.slice(0, newPosition), member, this.queue.slice(newPosition));

    this.timeoutUpdateDisplay();
    this.client.dataSource.saveMonitor(this.id);
  }

  timeoutUpdateDisplay() {
    if (this.updateTimer) return;
    this.updateTimer = setTimeout(() => this.updateDisplay(), 1500);
  }

  async updateDisplay() {
    if (!this.initialised) await this.init();
    this.updateTimer = null;
    try {
      this.client.channels.resolve(this.displayChannel).messages.fetch(this.displayMessage).then(message => {
        message.edit(Util.removeMentions(this.message));
      });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = ChannelMonitor;