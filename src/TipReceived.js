if ($tip.tokens === $settings.tokenAmout) {
  giveUserReqCredits($user.username, $settings.reqsGivenPerTip, true)

  if ($tip.message) {
    let resps = []
    const songs = $tip.message.split(',')
    for (let i = 0; i < songs.length; i++) {
      resps.push(addUserReq($user.username, songs[i]))
    }
    if (resps.length) {
      $room.sendNotice(resps.join('\n'))
    }
  }
}