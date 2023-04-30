if ($tip.tokens === tokenAmout) {
  giveUserReqCredits($user.username, reqsGivenPerTip, true)

  if ($tip.message) {
    const resp = addUserReq($user.username, $tip.message)
    if (resp) {
      $room.sendNotice(resp)
    }
  }
}