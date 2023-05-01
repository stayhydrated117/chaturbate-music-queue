const hasPriv = ($user.username === $room.owner) || ($user.isMod && $settings.modsHavePriv)
const cmd = parseCmdFromMsg($message.body)
const cmdArgs = parseCmdArgsFromMsg($message.body)

let resp = ''
switch (cmd) {
  case Command.Show:
    resp = queueToMsgFormat(getQueue())
    if (hasPriv) {
      $room.sendNotice(resp)
      resp = ''
    }
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
  case Command.ShowReqCredits:
    resp = showUserReqCredits($user.username, cmdArgs[0], hasPriv)
    break
  case Command.ShowTipCost:
    resp = `Tip ${$settings.tokenAmout} token${$settings.tokenAmout === 1 ? '' : 's'} to request a song`
    break
  case Command.Help:
    resp = `Music Queue Usage: todo`
    break
}

if (resp) {
  $room.sendNotice(resp, { toUsername: $user.username })
}
