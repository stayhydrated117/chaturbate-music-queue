const queueCmd = '/q(ueue)?'
const Command = Object.freeze({
  Queue: 'Queue',
  Next: 'Next',
  Add: 'Add',
  Remove: 'Remove',
  Edit: 'Edit',
  Clear: 'Clear',
  TipCost: 'TipCost',
  Credits: 'Credits',
  Help: 'Help',
})
const songRecChatMsgPattern = /.* (-|by) .*/g
const MAX_SONG_NAME_LENGTH = 500

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
  return `${username}`.trim().replace(/^@/g, '')
}

function formatCredits(credits) {
  const creditsInt = parseIntFromInput(credits)
  return creditsInt > -1 ? creditsInt : 0
}

function formatSongName(songName) {
  if (!songName || typeof songName !== 'string') {
    songName = ''
  }
  return (
    `${songName}`
      .trim()
      .substring(0, MAX_SONG_NAME_LENGTH)
  )
}

function songToMsgFormat({ username, song, isAnon }) {
  let songText = `${formatSongName(song)}`
  if ($settings.showReqAddedBy && username && !isAnon) {
    songText = `${songText} (added by ${username})`
  }
  return songText
}

function queueToMsgFormat(queue) {
  let queueMsgText = 'Music Queue:'
  queueMsgText += queue.reduce((msg, song, index) => (
    `${msg}\n${index+1}. ${songToMsgFormat(song)}`
  ), '') || ' (empty)'
  return queueMsgText
}

function parseCmdFromMsg(msgBody) {
  if (!msgBody || typeof msgBody !== 'string') {
    return ''
  }
  if (!msgBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    return ''
  }
  if (msgBody.match(new RegExp(`^${queueCmd}( )?$`, 'gi'))) {
    return Command.Queue
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (n(ext)?( )?)$`, 'gi'))) {
    return Command.Next
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (cl(ear)?( )?)$`, 'gi'))) {
    return Command.Clear
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (r(m|emove)?|d(el(ete)?)?) `, 'gi'))) {
    return Command.Remove
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (a(dd)?) `, 'gi'))) {
    return Command.Add
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (e(dit)?|u(pdate)?|c(hange)?|m(odify)?) `, 'gi'))) {
    return Command.Edit
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (t(okens?|ip)?(-?cost)?|cost|price)( )?$`, 'gi'))) {
    return Command.TipCost
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (cred(it)?s?|req(uest)?s?)`, 'gi'))) {
    return Command.Credits
  }
  if (msgBody.match(new RegExp(`^${queueCmd} (help|h)( )?$`, 'gi'))) {
    return Command.Help
  }
  return ''
}

function parseCmdArgsFromMsg(cmd, msgBody) {
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

function isMsgValidSongRequest(msgBody) {
  if (!msgBody || typeof msgBody !== 'string') {
    return false
  }
  return !msgBody.match(songRecChatMsgPattern, 'gi')
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
  if (!$settings.addRequestViaCmd && !hasQueuePriv) {
    return 'You are not permitted to use this command'
  }
  return addUserReq(msgUsername, msgSongName, false, hasQueuePriv, hasCreditPriv)
}

function tipAddUserReq(msgUsername, tipText, isAnon) {
  if (!$settings.addRequestViaTip) {
    return 'Not permitted to request songs via tip message'
  }
  return addUserReq(msgUsername, tipText, isAnon, false, false)
}

function msgAddUserReq(msgUsername, msgSongName) {
  if (!$settings.addRequestViaChatMsg) {
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
  const username = formatUsername(msgUsername)
  const songName = formatSongName(msgSong)
  const pos = parseIntFromInput(msgPosition) - 1
  const queue = getQueue()

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
    return `Unknown app kv storage error updating ${songItem.song} to be ${songName}`
  }
  return `Song #${pos + 1} changed from ${songItem.song} to ${songName}`
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
  const creditsToGive = $settings.reqsGivenPerTip || 1
  const newCredits = incrUserReqCredits(usernameToCredit, creditsToGive)
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
  if (!id || typeof id !== 'string') {
    id = ''
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
  if (!hasCreditPriv) {
    $kv.decr(username)
  }
  setCheckNextMsgForSong(username, false)
  return `${songName} added to queue`
}

function getUserReqCredits(username) {
  const existingCredits = $kv.get(username, 0)
  return formatCredits(existingCredits)
}

function incrUserReqCredits(username, credits) {
  try {
    $kv.get(username)
  } catch (e) {
    $kv.set(username, 0)
  }
  $kv.incr(username, credits)
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
  if (!$settings.addRequestViaChatMsg) {
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
const help = {
  chatMsg: ''
}
