const hasPriv = ($user.username === $room.owner) || ($user.isMod && modsHavePriv)
const cmd = parseCmdFromMsg($message.body)
const cmdArgs = parseCmdArgsFromMsg($message.body)

let resp = ''
switch (cmd) {
  case Command.Show:
    $room.sendNotice(queueToMsgFormat(getQueue()))
    break
  case Command.Add:
    resp = addUserReq($user.username, cmdArgs[0], hasPriv)
    break
  case Command.Remove:
    resp = removeFromQueue($user.username, cmdArgs[0], hasPriv)
    break
  case Command.Clear:
    resp = deleteQueue(hasPriv)
    break
  case Command.GiveReqCredits:
    resp = giveUserReqCredits(cmdArgs[0], cmdArgs[1], hasPriv)
    break
  case Command.ShowTipCost:
    resp = `Tip ${tokenAmout} token${tokenAmout === 1 ? '' : 's'} to request a song`
    break
  case Command.Help:
    resp = `Music Queue Usage:`
    break
}

if (autoAddSong && canUserAddReq($user.username) && $message.body.match(songRecMsgPattern)) {
  resp = addUserReq($user.username, $message.body, hasPriv)
}

if (resp) {
  $room.sendNotice(resp, { toUsername: $user.username })
}


