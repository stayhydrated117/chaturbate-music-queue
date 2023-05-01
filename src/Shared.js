const songKeyPrefix = 'queue-'
const songRecMsgPattern = /.* (-|by) .*/g
const queueCmd = '/(queue|q)'
const Command = {
  Show: 'show',
  Add: 'add',
  Remove: 'remove',
  Clear: 'clear',
  ShowTipCost: 'tip',
  GiveReqCredits: 'give-credits',
  ShowReqCredits: 'credits',
  Help: 'help',
}

function parseCmdFromMsg(messageBody) {
  if (!messageBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    return ''
  }
  if (messageBody.match(new RegExp(`^${queueCmd}$`, 'gi'))) {
    return Command.Show
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (clear|cl)$`, 'gi'))) {
    return Command.Clear
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (del|rm|d|r|remove|delete)`, 'gi'))) {
    return Command.Remove
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (add|ad|a)`, 'gi'))) {
    return Command.Add
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (tip|t|cost|tipcost|tip-cost)`, 'gi'))) {
    return Command.ShowTipCost
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (give|g|gc)`, 'gi'))) {
    return Command.GiveReqCredits
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (credits|c)`, 'gi'))) {
    return Command.ShowReqCredits
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (help|h)`, 'gi'))) {
    return Command.Help
  }
  return ''
}

function parseCmdArgsFromMsg(msgBody) {
  if (!msgBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    return []
  }
  const msgParts = msgBody.split(' ')
  return msgParts.slice(2)
}

function parseIndexFromInput(userInput) {
  const pos = parseInt(userInput, 10)
  const inputIsInteger = !isNaN(pos)
    && `${pos}`.length === `${userInput}`.length // handle case where song name starts with a number. parseInt will return that number even if the rest of the input is a string
  return inputIsInteger && (pos > -1) ? (pos - 1) : -1
}

function queueToMsgFormat(queue) {
  let queueMsgText = 'Music Queue:'
  queueMsgText += queue.reduce((reqText, req, index) => (
    `${reqText}\n${index+1}. ${req.song}`
  ), '') || ' (empty)'
  return queueMsgText
}

function canUserAddReq(username, hasPriv) {
  if (!$settings.tokenAmout || hasPriv) {
    return true
  }
  return getUserReqCredits(username) > 0
}

function addUserReq(username, song, hasPriv) {
  if (!canUserAddReq(username, hasPriv)) {
    return `You must first give a ${$settings.tokenAmout} token${$settings.tokenAmout === 1 ? '' : 's'} tip before requesting a song`
  }
  if (!song) {
    return `Please include a song to request`
  }
  const time = (new Date).getTime()
  $kv.set(`${songKeyPrefix}${time}`, {
    ts: time,
    username: formatUsernameKey(username),
    song: song.trim(),
  })
  $kv.decr(formatUsernameKey(username))
  return `${song} added to queue`
}

function getQueue() {
  const queue = []
  const kvIter = $kv.iter(songKeyPrefix)
  while (kvIter.next()) {
    const { ts, song, username } = kvIter.value()
    queue.push({
      key: kvIter.key(),
      ts,
      song,
      username,
    })
  }
  queue.sort((a,b) => new Date(a.ts) - new Date(b.ts))
  return queue
}

function removeFromQueue(username, songNameOrPos, hasPriv) {
  const pos = parseIndexFromInput(songNameOrPos)
  const queue = getQueue()

  // if input is potion in queue
  if (pos !== -1) {
    const songItem = queue[pos]
    if (!songItem) {
      return `Could find song to remove at position ${pos}`
    }
    if ((songItem.username !== formatUsernameKey(username)) && !hasPriv) {
      return `Cannot remove song (${songItem.song}) because it was not added by you`
    }
    const success = $kv.remove(songItem.key)
    if (!success) {
      return `Unknown app kv storage error removing ${songItem.song}`
    }
    return `${songItem.song} removed from queue`
  }
  // todo: support remove by song name
  return `Remove a song via its number in the queue (e.g. ${queueCmd} del 2)`
}

function deleteQueue(hasPriv) {
  if (!hasPriv) {
    return `Not permitted to clear the queue`
  }
  const kvIter = $kv.iter(songKeyPrefix)
  while (kvIter.next()) {
    $kv.remove(kvIter.key())
  }
  return 'Music queue cleared'
}

function giveUserReqCredits(username, creditsArg, hasPriv) {
  if (!hasPriv) {
    return `Not permitted to give credits`
  }
  const existingCredits = getUserReqCredits(username)
  const additionalCredits = formatCredits(creditsArg) || $settings.reqsGivenPerTip
  let newCredits = existingCredits + additionalCredits
  if (newCredits < 0) {
    newCredits = 0
  }
  const success = setUserReqCredits(username, newCredits)
  if (!success) {
    return `app kv errro setting credits for ${username} to ${newCredits}`
  }
  return `Credits for ${username} set to ${newCredits}`
}

function showUserReqCredits(username, argUsername, hasPriv) {
  if (formatUsernameKey(argUsername) && hasPriv) {
    username = argUsername
  }
  const existingCredits = getUserReqCredits(username)
  return `${username} has ${existingCredits} credit${existingCredits === 1 ? '' : 's'}`
}

// kv

function formatUsernameKey(username) {
  if (!username) {
    return ''
  }
  return username.replace('@', '').trim()
}

function formatCredits(credits) {
  if (!credits) {
    return 0
  }
  const creditsInt = parseInt(credits, 10)
  if (Number.isNaN(creditsInt)) {
      return 0
  }
  return creditsInt
}

function getUserReqCredits(username) {
  let existingCredits = 0
  try {
    existingCredits = $kv.get(formatUsernameKey(username))
  } catch (e) {
    //
  }
  return formatCredits(existingCredits)
}

function setUserReqCredits(username, credits) {
  return $kv.set(formatUsernameKey(username), formatCredits(credits))
}
