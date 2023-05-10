const msgBody = formatMsgBody($message.body)
const cmd = msgParseCmd(msgBody)
const cmdArgs = msgParseCmdArgs(cmd, msgBody)
const {
  editQueuePriv: canEditQueue,
  editCreditsPriv: canEditCredits
} = getPrivileges($room.owner, $user.username, $user.isMod)

let noticeText = ''
let isNoticePublic = false

if (cmd) {
  switch (cmd) {
    case Command.Show:
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
      noticeText = cmdEditQueue($user.username, cmdArgs[0], cmdArgs.slice(1).join(' '), canEditQueue)
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
      noticeText = cmdGetHelp(cmdArgs[0])
      break
  }
}
if (shouldCheckMsgForSong($user.username)) {
  if (!cmd && isMsgValidSongRequest(msgBody)) {
    noticeText = msgAddUserReq($user.username, msgBody)
  }
  setCheckNextMsgForSong($user.username, false)
}

if (noticeText) {
  $room.sendNotice(noticeText, getNoticeArgs($user.username, isNoticePublic))
}
