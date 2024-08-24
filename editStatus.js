function resetEditInProgress(tabName) {
  setEditInProgress(tabName, false)
}

function setEditInProgress(tabName, value) {
  const rowNums = getEditStatusData().rowNums
  const rowNum = rowNums[tabName]
  console.log(`Setting edit status of ${tabName} to ${value}`)
  getTab("TABS_EDIT_STATUS").getRange(rowNum,2).setValue(value)
}


function getEditInProgress(tabName) {
  const editStatuses = getEditStatusData().editStatuses
  console.log(editStatuses)
  return editStatuses[tabName]
}

function printEditInProgress(tabName) {
  console.log(getEditInProgress(tabName))
}

function getEditStatusData() {
  let data = getTab("TABS_EDIT_STATUS").getDataRange().getValues()
  let editStatuses = {}
  let rowNums = {}
  for(let i=1; i<data.length; i++) {
    rowNums[data[i][0]] = i+1
    editStatuses[data[i][0]] = data[i][1]
  }

  return {'rowNums':rowNums,'editStatuses':editStatuses}
}


function resetSomeStatus() {
  let tabNames = ["MANAGER_PHONE_CALL_SUBMISSIONS"]
  for(let i=0; i<tabNames.length; i++)
    resetEditInProgress(tabNames[i])
}