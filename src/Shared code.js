const queueCmd = '/q(ueue)?'
const Command = Object.freeze({
  Show: 'Show',
  Next: 'Next',
  Add: 'Add',
  Remove: 'Remove',
  Edit: 'Edit',
  Clear: 'Clear',
  TipCost: 'TipCost',
  Credits: 'Credits',
  Help: 'Help',
})
const songRecChatMsgPattern = '.* (-|by) .*'
const MAX_SONG_NAME_LENGTH = 500
const MAX_CREDITS_PER_USER = 1000

function formatMsgBody(messageBody) {
  if (Array.isArray(messageBody)) {
    messageBody = messageBody.join(' ')
  }
  if (!messageBody || typeof messageBody !== 'string') {
    return ''
  }
  return `${messageBody}`.replace(/ +(?= )/g, '') // remove all double/multi spaces
}

function formatUsername(username) {
  if (!username || typeof username !== 'string') {
    return ''
  }
  return (
    `${username}`
      .trim()
      .replace(/^@/g, '')
  )
}

function formatCredits(credits) {
  const creditsInt = parseIntFromInput(credits)
  return creditsInt > -1 ? Math.min(creditsInt, MAX_CREDITS_PER_USER) : 0
}

function formatSongName(songName) {
  if (!songName) {
    songName = ''
  }
  return (
    `${songName}`
      .trim()
      .substring(0, MAX_SONG_NAME_LENGTH)
  )
}

function songToMsgFormat({ username, song, isAnon }, noQuotes = false) {
  let songText = `${noQuotes ? '' : '"'}${formatSongName(song)}${noQuotes ? '' : '"'}`
  if ($settings.showReqAddedBy && username && !isAnon) {
    songText = `${songText} (added by ${username})`
  }
  return songText
}

function queueToMsgFormat(queue) {
  let queueMsgText = 'Music Queue:'
  queueMsgText += queue.reduce((msg, song, index) => (
    `${msg}\n${index+1}. ${songToMsgFormat(song, true)}`
  ), '') || ' (empty)'
  return queueMsgText
}

function msgParseCmd(msgBody) {
   if (!msgBody || typeof msgBody !== 'string') {
    return ''
  }
  if (!msgBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    return ''
  }
  return parseCmd(msgBody) 
}

function parseCmd(msgBody) {
  msgBody = (
    formatMsgBody(msgBody)
    .replace(new RegExp(`^${queueCmd}( )?`, 'gi'), '')
    .trim()
  )

  if (msgBody.match(new RegExp(`^(s(how)?|l(s|ist)?)?( )?$`, 'gi'))) {
    return Command.Show
  }
  if (msgBody.match(new RegExp(`^n(ext)?( )?$`, 'gi'))) {
    return Command.Next
  }
  if (msgBody.match(new RegExp(`^cl(ear)?( )?$`, 'gi'))) {
    return Command.Clear
  }
  if (msgBody.match(new RegExp(`^(r(m|emove)?|d(el(ete)?)?)( )`, 'gi'))) {
    return Command.Remove
  }
  if (msgBody.match(new RegExp(`^a(dd)?( )`, 'gi'))) {
    return Command.Add
  }
  if (msgBody.match(new RegExp(`^(e(dit)?|u(pdate)?|c(hange)?|m(odify)?)( )`, 'gi'))) {
    return Command.Edit
  }
  if (msgBody.match(new RegExp(`^(t(okens?|ip)?(-?cost)?|cost|price)( )?$`, 'gi'))) {
    return Command.TipCost
  }
  if (msgBody.match(new RegExp(`^(cred(it)?s?|req(uest)?s?)`, 'gi'))) {
    return Command.Credits
  }
  if (msgBody.match(new RegExp(`^(h(elp)?)`, 'gi'))) {
    return Command.Help
  }
  return ''
}

function msgParseCmdArgs(cmd, msgBody) {
  if (!cmd || !msgBody) {
    return []
  }
  const msgParts = msgBody.split(' ')
  return msgParts.slice(2)
}

function parseIntFromInput(input) {
  if (typeof input === 'number') {
    return input
  }
  if (!input) {
    return -1
  }
  const inputInt = parseInt(input, 10)
  if (Number.isNaN(inputInt)) {
      return -1
  }
  // handle the case where `input` is a string that starts with a number and has other characters after that (e.g. `10cats`). In that scenario parseInt will return the starting integer (`10`) instead of NaN, which is not the behavior we want for the music queue app.
  if (`${input}`.length !== `${inputInt}`.length) {
    return -1
  }
  return inputInt
}

function pluralize(word, num, ending = 's') {
  return `${num} ${word}${num === 1 ? '' : ending}`
}
const pl = pluralize


function getNoticeArgs(username, isNoticePublic) {
  const args = {}
  if (!isNoticePublic) {
    args.toUsername = username
  }
  return args
}

function getPrivileges(roomOwnerUsername, msgUsername, msgUserIsMod) {
  const editQueuePriv = (
    (roomOwnerUsername === msgUsername) ||
    (msgUserIsMod && $settings.modsHaveQueuePriv)
  )
  const editCreditsPriv = (
    (roomOwnerUsername === msgUsername) ||
    (msgUserIsMod && $settings.modsHaveCreditPriv)
  )
  return {
    editQueuePriv,
    editCreditsPriv,
  }
}

function getTipCost() {
  return `Tip ${pl('token', $settings.reqTipNumTokens)} to request a song`
}

function isMsgValidSongRequest(songRecMsgBody) {
  if (!songRecMsgBody || typeof songRecMsgBody !== 'string') {
    return false
  }
  return songRecMsgBody.match(new RegExp(songRecChatMsgPattern, 'gi'))
}

function canUserAddReq(username, hasPriv) {
  if (!$settings.reqTipNumTokens || hasPriv) {
    return true
  }
  return getUserReqCredits(username) > 0
}

function cmdGetQueue() {
  return queueToMsgFormat(getQueue())
}

function cmdNextSongInQueue(msgPosition = 1, hasPriv) {
  if (!hasPriv) {
    return 'Not permitted to change to the next song'
  }
  const queue = getQueue()
  if (!queue.length) {
    return 'No next song - the queue is empty'
  }
  const pos = parseIntFromInput(msgPosition) - 1
  if (pos < 0) {
    return `Please provide a valid position in the queue (tried to use ${msgPosition})`
  }
  const nextSong = queue[pos]
  if (!nextSong) {
    return `Could not find song to remove at position ${msgPosition}`
  }
  $kv.remove(nextSong.key)
  return `The next song is ${songToMsgFormat(nextSong)}`
}

function cmdAddUserReq(msgUsername, msgSongName, hasQueuePriv, hasCreditPriv) {
  if (!$settings.addRequestViaCmdEnabled && !hasQueuePriv) {
    return 'You are not permitted to use this command'
  }
  return addUserReq(msgUsername, msgSongName, false, hasQueuePriv, hasCreditPriv)
}

function tipAddUserReq(msgUsername, tipText, isAnon) {
  if (!$settings.addRequestViaTipEnabled) {
    return 'Not permitted to request songs via tip message'
  }
  return addUserReq(msgUsername, tipText, isAnon, false, false)
}

function msgAddUserReq(msgUsername, msgSongName) {
  if (!$settings.addRequestViaChatMsgEnabled) {
    return 'Not permitted to request songs via chat message'
  }
  return addUserReq(msgUsername, msgSongName, false, false, false)
}

function cmdRemoveFromQueue(msgUsername, msgPosition, hasPriv) {
  const username = formatUsername(msgUsername)
  const pos = parseIntFromInput(msgPosition) - 1
  const queue = getQueue()

  if (pos < 0) {
    return `Please provide a valid position in the queue (tried to use ${msgPosition})`
  }
  const songItem = queue[pos]
  if (!songItem) {
    return `Could not find song to remove at position ${msgPosition}`
  }
  if ((songItem.username !== username) && !hasPriv) {
    return `Cannot remove song (${formatSongName(songItem.song)}) because it was not added by you`
  }
  const success = $kv.remove(songItem.key)
  if (!success) {
    return `Unknown app kv storage error removing ${songItem.song}`
  }
  return `${songToMsgFormat(songItem)} removed from queue`
}

// todo: shares a lot of similar code as `removeFromQueue`
function cmdEditQueue(msgUsername, msgPosition, msgSong, hasPriv) {
  if (!$settings.reqEditable && !hasPriv) {
    return 'Not permitted to edit the queue'
  }
  const username = formatUsername(msgUsername)
  const songName = formatSongName(msgSong)
  const pos = parseIntFromInput(msgPosition) - 1
  const queue = getQueue()

  if (!songName) {
    return `Please provide a new song name`
  }
  if (pos < 0) {
    return `Please provide a valid position in the queue (tried to use ${msgPosition})`
  }
  const songItem = queue[pos]
  if (!songItem) {
    return `Could find song to edit at position ${msgPosition}`
  }
  if ((songItem.username !== username) && !hasPriv) {
    return `Cannot edit song (${songItem.song}) because it was not added by you`
  }
  const success = $kv.set(songItem.key, {
    key: songItem.key,
    ts: songItem.ts,
    song: songName,
    username: songItem.username,
    isAnon: songItem.isAnon,
  })
  if (!success) {
    return `Unknown app kv storage error updating "${songItem.song}" to be "${songName}"`
  }
  return `Song #${pos + 1} changed from "${songItem.song}" to "${songName}"`
}

function cmdDeleteQueue(hasPriv) {
  if (!hasPriv) {
    return `Not permitted to clear the queue`
  }
  const kvIter = $kv.iter(queueKeyPrefix)
  while (kvIter.next()) {
    $kv.remove(kvIter.key())
  }
  return 'Music queue cleared'
}

// todo: refactor; this function does too much
function cmdRequestCredits(msgUsername, msgArgUsername, msgArgCredits, hasPriv) {
  const username = formatUsername(msgUsername)
  const usernameToCredit = formatUsername(msgArgUsername)
  const creditsToGive = formatCredits(msgArgCredits)

  if (!usernameToCredit || ((usernameToCredit === username) && !msgArgCredits)) {
    const credits = getUserReqCredits(username)
    return `You have ${pl('song request credit', credits)}`
  }

  if (!hasPriv) {
    if (usernameToCredit !== username) {
      return `Not permitted to view or modify another user's song request credits`
    }
    return `Not permitted modify song request credits`
  }

  if (!creditsToGive) {
    if (
      msgArgCredits &&
      msgArgCredits.match(new RegExp(`^(r(eset|m|emove)|cl(ear)?|del(ete)?)( )?$`, 'gi'))
     ) {
      const previousCredits = setUserReqCredits(usernameToCredit, 0)
      if (previousCredits === -1) {
        return `app kv errro setting credits for ${usernameToCredit} to 0`
      }
      return `Song request credits for ${usernameToCredit} set to 0 (previously was ${previousCredits})`
    }
    const credits = getUserReqCredits(usernameToCredit)
    return `${usernameToCredit} has ${pl('song request credit', credits)}`
  }

  const newCredits = incrUserReqCredits(usernameToCredit, creditsToGive)
  return `${usernameToCredit} now has ${pl('song request credit', newCredits)}`
}

function tipAddRequestCredits(username) {
  const usernameToCredit = formatUsername(username)
  const credits = formatCredits($settings.reqCreditsGivenPerTip)
  const newCredits = incrUserReqCredits(usernameToCredit, credits)
  return `You now have ${pl('song request credit', newCredits)}`
}

// kv
const queueKeyPrefix = 'queue-'
const checkNextMsgKeyPrefix = 'chatmsg-'

function getCheckNextMsgKey(username) {
  username = formatUsername(username)
  if (!username) {
    return ''
  }
  if (username.indexOf(checkNextMsgKeyPrefix) === 0) {
    return username
  }
  return `${checkNextMsgKeyPrefix}${username}`
}

function getQueueKey(id) {
  if (!id) {
    id = ''
  }
  if (typeof id !== 'string') {
    id = `${id}`
  }
  if (id.indexOf(queueKeyPrefix) === 0) {
    return id
  }
  return `${queueKeyPrefix}${id}`
}

function getQueue() {
  const queue = []
  const kvIter = $kv.iter(getQueueKey())
  while (kvIter.next()) {
    const { ts, song, username, isAnon } = kvIter.value()
    queue.push({
      key: kvIter.key(),
      ts,
      song,
      username,
      isAnon,
    })
  }
  queue.sort((a,b) => new Date(a.ts) - new Date(b.ts))
  return queue
}

function addUserReq(msgUsername, msgSongName, isAnon, hasQueuePriv, hasCreditPriv) {
  const username = formatUsername(msgUsername)
  const songName = formatSongName(msgSongName)
  if (!canUserAddReq(username, hasQueuePriv) && !hasCreditPriv) {
    return `You must first give a ${$settings.reqTipNumTokens} token tip before requesting a song`
  }
  if (!songName) {
    return `Please include a song to request`
  }
  const time = (new Date).getTime()
  $kv.set(getQueueKey(time), {
    ts: time,
    username,
    song: songName,
    isAnon: !!isAnon,
  })
  if (!hasCreditPriv && $settings.reqTipNumTokens) {
    $kv.decr(username)
  }
  setCheckNextMsgForSong(username, false)
  return `"${songName}" added to queue`
}

function getUserReqCredits(username) {
  const existingCredits = $kv.get(username, 0)
  return formatCredits(existingCredits)
}

function incrUserReqCredits(username, credits) {
  let existingCredits = 0
  try {
    existingCredits = $kv.get(username)
  } catch (e) {
    $kv.set(username, 0)
  }
  if (existingCredits + credits >= MAX_CREDITS_PER_USER) {
    $kv.set(username, MAX_CREDITS_PER_USER)
  } else {
    $kv.incr(username, credits)
  }
  
  return $kv.get(username)
}

function setUserReqCredits(username, credits) {
  const previousCredits = $kv.get(username, 0)
  const success = $kv.set(username, formatCredits(credits))
  if (!success) {
    return -1
  }
  return previousCredits
}

function shouldCheckMsgForSong(username) {
  if (!$settings.addRequestViaChatMsgEnabled) {
    return false
  }
  const key = getCheckNextMsgKey(username)
  if (!key) {
    return false
  }
  return $kv.get(key, false)
}

function setCheckNextMsgForSong(username, check = false) {
  const key = getCheckNextMsgKey(username)
  if (!key) {
    return false
  }
  return $kv.set(key, check)
}

// help messages
function cmdGetHelp(msgBody) {
  const helpCmd = parseCmd(msgBody)
  if (msgBody && helpCmd && helpMore[helpCmd]) {
    let helpMoreMsg = helpMore[helpCmd]
    if (Array.isArray(helpMoreMsg)) {
      helpMoreMsg = helpMoreMsg.join('\n')
    }
    return `Music Queue Help: ${helpCmd}\n${helpMoreMsg}`
  }
  return [
    help.usage,
    help[Command.Show],
    help[Command.Next],
    help.stillConfused,
  ].join('\n')
}

const help = {
  usage: 'Music Queue Usage:\n/queue [next | add <song name> | edit <position> <new song> | remove <position> | clear | credit [username] [credits] | cost | help [command]]',
  stillConfused: 'You can use `/queue help <command>` for more information about a command',
  [Command.Show]: '/queue - Show the current songs in queue.',
  [Command.Next]: '/queue next - Moves queue forward one song',
  [Command.Add]: '/queue add <song name> - Adds a song request to the queue',
  chatMsg: 'Your next chat message will be your song request if it matches the format <song name> by <artist name> or <song name> - <artist name>',
}

const helpMore = {
  [Command.Next]: [
    '/queue next',
    'Moves queue forward one song',
    'Example:',
    '/queue next',
    'Notice: The next song is Zero by The Smashing Pumpkins',
  ],
  [Command.Add]: [
    '/queue add <song name>',
    'Adds a song request to the queue',
    'Fails if you do not satisfy song request requirements (i.e. you have not tipped to request a song yet)',
    'Example:',
    '/queue add don\'t fade away by beach fossils',
    'Notice: don\'t fade away by beach fossils added to queue (#2)',
  ]
}
