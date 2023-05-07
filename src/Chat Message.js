const messageBody = formatMsgBody($message.body)
const cmd = parseCmdFromMsg(messageBody)
const cmdArgs = parseCmdArgsFromMsg(cmd, messageBody)
const {
  editQueuePriv: canEditQueue,
  editCreditsPriv: canEditCredits
} = getPrivileges($room.owner, $user.username, $user.isMod)

let noticeText = ''
let isNoticePublic = false

if (cmd) {
  switch (cmd) {
    case Command.Queue:
      noticeText = cmdGetQueue()
      isNoticePublic = canEditQueue
      break
    case Command.Next:
      noticeText = cmdNextSongInQueue(cmdArgs[0], canEditQueue)
      isNoticePublic = canEditQueue
      break
    case Command.Add:
      noticeText = cmdAddUserReq($user.username, cmdArgs.join(' '), canEditQueue, canEditCredits)
      break
    case Command.Remove:
      noticeText = cmdRemoveFromQueue($user.username, cmdArgs[0], canEditQueue)
      break
    case Command.Edit:
      noticeText = cmdEditQueue($user.username, cmdArgs[0], cmdArgs[1], canEditQueue)
      break
    case Command.Clear:
      noticeText = cmdDeleteQueue(canEditQueue)
      isNoticePublic = canEditQueue
      break
    case Command.Credits:
      noticeText = cmdRequestCredits($user.username, cmdArgs[0], cmdArgs[1], canEditCredits)
      break
    case Command.TipCost:
      noticeText = getTipCost()
      break
    case Command.Help:
      noticeText = `Music Queue Usage: todo`
      break
  }
}

if (shouldCheckMsgForSong($user.username)) {
  if (!cmd && isMsgValidSongRequest(messageBody)) {
    noticeText = msgAddUserReq($user.username, messageBody)
  }
  setCheckNextMsgForSong($user.username, false)
}

if (noticeText) {
  $room.sendNotice(noticeText, getNoticeArgs($user.username, isNoticePublic))
}
