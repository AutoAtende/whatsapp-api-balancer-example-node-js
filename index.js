const { Channel } = require("./core/channel");
const config = require("./config.json");
const {
  moveNotUsedTokenToUsed,
  getNotUsedChannels,
  removeUnAuthToken,
  checkFiles,
} = require("./core/files");

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function selectRandomChannel() { // get random channel
  const tokens = getNotUsedChannels(); // get not used tokens from file
  const randomIndex = randomIntFromInterval(0, tokens.length - 1); // random index of array
  const channel = new Channel(tokens[randomIndex]); // create instance of channel
  try {
    await channel.checkHealth(); //check channel status
  } catch (e) {
    if (e === 401) { // if channel not auth - remove him from tokens array in config and try new
      removeUnAuthToken(tokens[randomIndex]);
      return await selectRandomChannel();
    }
  }
  moveNotUsedTokenToUsed(channel.token);
  return channel;
}

async function timeOutCheckPhone(phone) {
  try {
    const channel = await selectRandomChannel();
    const phoneStatus = await channel.checkPhone(phone); // check phone in wa. if valid - exist
    const timeOfComplete = new Date();
    console.log(
      `${channel.token} check phone: ${phone}, in time: ${timeOfComplete}. Result: ${phoneStatus}`
    );
  } catch (e) {
    console.log(e);
  }
}

async function massCheckPhones(phones) {
  let delay = 0;
  for (let i = 0; i < phones.length; i++) {
    const randomDelay = randomIntFromInterval(config.minDelay, config.maxDelay); // random delay between checks
    delay += randomDelay;
    try {
      setTimeout(timeOutCheckPhone, delay, phones[i]); // set delayed check
    } catch (e) {
      console.log(e);
    }
  }
}

async function init() {
  if(config.tokens.length === 0) throw "Not found valid tokens! (check config.json)";
  checkFiles();
  await massCheckPhones([]);
}

init().then(() => console.log("Started"));
