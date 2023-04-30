const { autoAddSong, tokenAmout, reqsGivenPerTip, modsHavePriv } = $settings
const songKeyPrefix = 'queue-'
const songRecMsgPattern = /.* (-|by) .*/g
const queueCmd = $settings.queueCmd.trim()
const Command = {
  Show: 'show',
  Add: 'add',
  Remove: 'remove',
  Clear: 'clear',
  ShowTipCost: 'tip',
  GiveReqCredits: 'credits',
  Help: 'help',
}

function parseCmdFromMsg(messageBody) {
  if (!messageBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    return
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
  if (messageBody.match(new RegExp(`^${queueCmd} (tip|t|cost|c|tipcost|tip-cost)`, 'gi'))) {
    return Command.ShowTipCost
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (give|g|credit|gc)`, 'gi'))) {
    return Command.GiveReqCredits
  }
  if (messageBody.match(new RegExp(`^${queueCmd} (help|h)`, 'gi'))) {
    return Command.Help
  }
}

function parseCmdArgsFromMsg(msgBody) {
  if (msgBody.match(new RegExp(`^${queueCmd}`, 'gi'))) {
    const msgParts = msgBody.split(' ')
    return msgParts.slice(2)
  }
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
  if (!tokenAmout || hasPriv) {
    return true
  }
  let userReqs = 0
  try {
    userReqs = $kv.get(username)
  } catch (e) {
    // ts-lint-ignore no-empty (probably incorrect tslint syntax but this comment's existence fixes the warning anyway lol)
  }
  return userReqs > 0
}

function addUserReq(username, song, hasPriv) {
  if (!canUserAddReq(username, hasPriv)) {
    return `You must first give a ${tokenAmout} token${tokenAmout === 1 ? '' : 's'} tip before requesting a song`
  }
  if (!song) {
    return `Please include a song to request`
  }
  const time = (new Date).getTime()
  $kv.set(`${songKeyPrefix}${time}`, {
    ts: time,
    username,
    song,
  })
  $kv.decr(username)
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
    if ((songItem.username !== username) && !hasPriv) {
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

function giveUserReqCredits(username, credits, hasPriv) {
  if (!hasPriv) {
    return `Not permitted to give credits`
  }
  try {
    $kv.get(username)
  } catch (e) {
    $kv.set(username, 0)
  }
  $kv.incr(username, credits || reqsGivenPerTip)
}

