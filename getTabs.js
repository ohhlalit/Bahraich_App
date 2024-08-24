/** 
* Returns the tab related with the argument.
* The argument is the name of the tab (capitalized). So to access 'in hospital' tab, call getTab("IN_HOSPITAL").
* Refer to the Parameters.gs script to know how a tab is named and parameterized.
*
* @param {string} name 
* @return {SpreadsheetApp.Sheet}
*/

function getTab_ (name) {

  //Use eval() to get the value of the resulting variable names instead of just the string. So for example eval will extract the value of the constant IN_HOSPITAL_SHEET
  let sheet = eval(name + "_SHEET")
  let tabname = eval(name + "_TAB")
  
  let tab = SpreadsheetApp.openById(sheet).getSheetByName(tabname)
  console.log("Accessed Tab: " + name)
  
  return tab
}

function getTab (name) {

  //Use eval() to get the value of the resulting variable names instead of just the string. So for example eval will extract the value of the constant IN_HOSPITAL_SHEET
  let sheet = eval(name + "_SHEET")
  let tabname = eval(name + "_TAB")
  
  let tab = SpreadsheetApp.openById(sheet).getSheetByName(tabname)
  console.log("Accessed Tab: " + name)
  
  return tab
}


/**
 * Take the name of a sheet and converts it into the corresponding tabname (in standard convention) for usage across different functions
 */

function getTabNameFromSheetName(sheetName) {
  let tabName
  switch (sheetName) {
    case "grad suggestions":
      tabName = "GRAD_SUGGESTIONS"
      break
    case "grad resolved":
      tabName = "GRAD_RESOLVED"
      break
    case "supplies return-active":
      tabName = "SUPPLIES_RETURN_ACTIVE"
      break
    case "supplies return-resolved":
      tabName = "SUPPLIES_RETURN_RESOLVED"
      break
    case "home visit-active":
      tabName = "HOME_VISIT_ACTIVE"
      break
    case "home visit-resolved":
      tabName = "HOME_VISIT_RESOLVED"
      break
    case "priority calls-active":
      tabName = "PRIORITY_CALLS_ACTIVE"
      break
    case "priority calls-resolved":
      tabName = "PRIORITY_CALLS_RESOLVED"
      break
    case "OPD visits - active":
      tabName = "OPD_VISITS_ACTIVE"
      break
    case "OPD visits - resolved":
      tabName = "OPD_VISITS_RESOLVED"
      break
    case "formula-active":
      tabName = "FORMULA_ACTIVE"
      break
    case "formula-resolved":
      tabName = "FORMULA_RESOLVED"
      break
    case "Complementary Feeding (formula deliv stopped)":
      tabName = "COMPLIMENTARY_FEEDING"
      break
    case "patient location & forms":
      tabName = "PATIENT_FORM"
      break
    case "imp intake info":
      tabName = "INTAKE_INFO"
      break
    case "error check":
      tabName = "ERROR_CHECKS"
      break
  }

  if (tabName == undefined)
    throw `Code not configured for tab "${sheetName}}."`
  else
    return tabName
  
}

    