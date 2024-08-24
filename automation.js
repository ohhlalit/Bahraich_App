function dailyAutomation() {

  //Archive Dead Babies
  archiveDeadBabies_dbr()
  console.warn("Archived Dead Babies")

  //export location data submission
  exportLocationSubmission()
  console.warn("Exported Location Submission")
  //Sheet to create database for the Case Viewer App (source: masterSheet.gs)
  createMasterSheet()
  console.warn("Created Master Sheet")
  //Export data from Managers Phone Call Sheet
  callerSheet_exportData_dbr()
  console.warn("Exported Calls")
  //Graduate Suggestions (Look for babies above CA 44 and/or update data for them in grad suggestions tab)
  getGradSuggestions_dbr()
  console.warn("Updated Grad Suggestions")
  //Sync doctors report
  syncDoctorsReport()
  console.warn("Synced Doctors Report")
  //generate CaseSheet
  generatePreFilledCaseSheet()
  console.warn("Generated Pre Filled CaseSheet")
  //generate KMC
  generatePreFilledKMC()
  console.warn("Generated Pre Filled KMC")
  //generate Calling List
  generateCallingList()
  console.warn("Generated Calling List")
  //Send Process Monitoring Forms and Update the Sheet
  sendFormEmails()
  console.warn("Sent PM Emails")
  
  console.warn("Finished Automation")
  
}

function sortDataBase1() {

  let sortTabArray=[
  "PHONE_HOME"]
  
  for (let i = 0; i<sortTabArray.length; i++)
    sortTab(sortTabArray[i])

}

function sortDataBase2() {

  let sortTabArray=[
  "IN_HOSPITAL",
  "DIED_IN_ASMC",
  "DIED_OUT_ASMC",
  "UNREACHABLE",
  "REFUSAL",
  "DO_NOT_FOLLOW",
  "FORMULA_ACTIVE",
  "PRIORITY_CALLS_ACTIVE",
  "OPD_VISITS_ACTIVE",
  "HOME_VISIT_ACTIVE"
  ]
  
  for (let i = 0; i<sortTabArray.length; i++)
    sortTab(sortTabArray[i])

}

