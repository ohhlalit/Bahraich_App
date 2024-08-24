function markAsDead(ids) {
  try { //First try to update date to follow up within manager phone call sheet
    updateLastRowColumnsById_("MANAGER_PHONE_CALL_SUBMISSIONS",ids,["date_to_follow_up"],["Dead"])
  } catch (e) {
    if (e.indexOf("Cannot Update Data") > -1) //If not found because the id doesn't exist (this is checking if the custom error message when id is not found is thrown)
      updateLastRowColumnsById_("PHONE_HOME",ids,["date_to_follow_up"],["Dead"]) //Update Phone/Home
    else
      throw e //Throw any other errors that may have come up
  }
}












































