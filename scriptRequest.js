/**
 * Makes the request to the central account. Requires the email of the user making the request, and name of the script
 * 
 * @param {string} scriptName - Use BahraichApp.Scripts. to see available scripts
 * @param {string} ids - Comma separated IDs. Usually would come from a getUi() call to the user to enter comma separated IDs to perform a task on
 * 
 * @return void
 */
function requestScript(scriptName, ids) {
  let idList = ids || []
  idList = idList.join(";")
  if (scriptName == undefined)
    throw "The requested script is not found. Please contact programming team"
  else {
    let username = Session.getActiveUser().getEmail().split("@")[0]

    time = getTime()
    let scriptRequest = [username, scriptName, time, idList]
    
    insertData("SCRIPT_REQUESTS", -1, [scriptRequest])
  }
    
}


























































