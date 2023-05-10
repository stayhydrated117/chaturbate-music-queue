if ($tip.tokens === $settings.reqTipNumTokens) { 
  tipAddRequestCredits($user.username)
  
  const tipMsg = formatMsgBody($tip.message)
  if (tipMsg && $settings.addRequestViaTipMsgEnabled) {
    const resp = tipAddUserReq($user.username, tipMsg, $tip.isAnon)
    if (resp) {
      $room.sendNotice(resp, getNoticeArgs($user.username))
    }
  } else if ($settings.addRequestViaChatMsgEnabled) {
    setCheckNextMsgForSong($user.username, true)
    $room.sendNotice(help.chatMsg, { toUsername: $user.username })
  }
}
