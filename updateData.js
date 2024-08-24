
function updateSheetLookUpData() {
    let tab = getTab_("UPDATE_DATA") // Get the sheet using getTab_ function
    let values = tab.getDataRange().getValues()
    let id = String(values[0][1]) //Cell B1
    const lastRow = UPDATE_DATA_LAST_ROW_INDEX
    try { 
      tab.deleteRows(lastRow+2,values.length-lastRow-1) //Delete rows after Religion to then manually add address and phone number info
    } catch (e) {
      console.log("Error in update sheet rows:", e)
    }
    
    
    
    let [staticIndices,staticDataById] = getData("STATIC")
    let [,intakeDataById] = getData("INTAKE")
    let [addIndices,addDataById] = getData("ADDRESSES")
    //add phone_number look up data
    let [phoneIndices, phoneDataById] = getData("PHONE_NUMBERS")


    let staticData = staticDataById[id]
    let intakeData = intakeDataById[id]
    
    let addData = ""
    if(addDataById[id])
        addData = addDataById[id].case_history
    
    let phoneData = ""
    if(phoneDataById[id])
        phoneData = phoneDataById[id].case_history

    
    let currentData = values.slice(UPDATE_DATA_FIRST_ROW_INDEX,UPDATE_DATA_LAST_ROW_INDEX+1)
    let newData = []
    for(let i=0; i<currentData.length; i++) {
        const currentRow = currentData[i]
        const attr = currentRow[0]
        let newRow = []
        newRow.push(attr)
        newRow.push("")
        let val
        if(attr == "birthday" | attr == "initial weight date")
            val = staticData[parseColumn_(attr)]
        else {
            val = String(staticData[parseColumn_(attr)])
            if (val == "undefined")
                if(intakeData)
                    val = String(intakeData[parseColumn_(attr)])
                else
                    val = ""
        }    
        newRow.push(val)
        newData.push(newRow)
    }

    //Phone numbers
    console.log(staticData)
    
    //phone numbers from DBR phone number sheet (update status)
    newData.push(["New Phone Number","",""]) //Add new phone number row
    newData.push(['New Description',"",""])
    newData.push(['New Status',"",""])
    

    let phRows = []
    
    let currentPrimaryPh = 0
    for(let i=0; i<phoneData.length; i++) {
        let phNoRow = ["Phone Number: "+(i+1)]
        let phDescRow = ["Description: "+(i+1)]
        let phStatusRow = ["Status: "+(i+1)]

        phNoRow.push("")
        phDescRow.push("")
        phStatusRow.push("")

        phNoRow.push(phoneData[i][phoneIndices.phone_number])
        phDescRow.push(phoneData[i][phoneIndices.description])
        phStatusRow.push(phoneData[i][phoneIndices.status])

        phRows.push(phNoRow)
        phRows.push(phDescRow)
        phRows.push(phStatusRow)

        if(phoneData[i][phoneIndices.preferred])
            currentPrimaryPh = i+1
    }

    newData.push(["Primary Phone No.","",String(currentPrimaryPh)])
    
    console.log(phRows)
    console.log(newData)
    newData = [...newData, ...phRows]
    console.log(newData)
    
    //Addresses
    newData.push(["New Address","",""]) //Add new address row
    newData.push(["New Block","",""]) //Add new address row
    newData.push(["New Address Information","",""]) //Add new address row
    
    let addRows = []
    let primaryAddress = staticData.address
    let currentPrimaryAdd = 0
    for(let i=0; i<addData.length; i++) {
        let addRow = ["Address: "+(i+1)]
        let blockRow = ["Block: "+(i+1)]
        let addInfoRow = ["Address Information: "+(i+1)]

        addRow.push("")
        blockRow.push("")
        addInfoRow.push("")

        addRow.push(addData[i][addIndices.address])
        blockRow.push(addData[i][addIndices.block])
        addInfoRow.push(addData[i][addIndices.address_description])

        addRows.push(addRow)
        addRows.push(blockRow)
        addRows.push(addInfoRow)

        if(primaryAddress == addData[i][addIndices.address])
            currentPrimaryAdd = i+1
    }


    newData.push(["Primary Address","",String(currentPrimaryAdd)])

    newData = [...newData, ...addRows]

    tab.getRange(UPDATE_DATA_FIRST_ROW_INDEX+1,1,newData.length,3).setValues(newData)
    setPhoneStatusValidationRule_(tab,newData)
}

function setPhoneStatusValidationRule_(tab,newData) {

    let allowedValues = ['Active', 'Inactive'] // Specify the allowed values
    let rule = SpreadsheetApp.newDataValidation().setAllowInvalid(false).requireValueInList(allowedValues,true).build()
  
    for(let i=0; i<newData.length; i++) {
        if(newData[i][0].includes("Status")) {
            let cell = tab.getRange(UPDATE_DATA_FIRST_ROW_INDEX+1+i,2,1,1)
            cell.setDataValidation(rule)
        }
    }
}

function clearUpdateSheet(noId) {
    
    let tab = getTab_("UPDATE_DATA") // Get the sheet using getTab_ function
    let values = tab.getDataRange().getValues()
    let id = String(values[0][1]) //Cell B1
    const lastRow = UPDATE_DATA_LAST_ROW_INDEX
    try { 
      tab.deleteRows(lastRow+2,values.length-lastRow-1) //Delete rows after Religion to then manually add address and phone number info
    } catch (e) {
      console.log("Error in update sheet rows:", e)
    }

    let currentData = values.slice(UPDATE_DATA_FIRST_ROW_INDEX,UPDATE_DATA_LAST_ROW_INDEX+1)
    let newData = []
    for(let i=0; i<currentData.length; i++)
        newData.push([currentData[i][0],"",""])

    tab.getRange(UPDATE_DATA_FIRST_ROW_INDEX+1,1,newData.length,3).setValues(newData)
    if(!(noId))
        tab.getRange("B1").setValue("")
}


function updateDataFromUpdateSheet() {
    
    let tab = getTab_("UPDATE_DATA") // Get the sheet using getTab_ function
    let values = tab.getDataRange().getValues()
    let id = String(values[0][1]) //Hard coded location of the id no
    
    let currentData = values.slice(UPDATE_DATA_FIRST_ROW_INDEX)

    let newData = {}
    let oldData = {}

    for(let i=0; i<currentData.length; i++) {
        //check which fields have been updated
        const attr = currentData[i][0]
        if (String(currentData[i][1]).trim() != "" & (String(currentData[i][1]).trim() != String(currentData[i][2]).trim() | attr == "initial weight date"))
            newData[attr] = currentData[i][1]
        oldData[attr] = currentData[i][2]
    }
    console.log("New Data:", newData)
    let updateCAs = 0
    if("GA (weeks)" in newData | "GA (days)" in newData)
        updateCAs = 1
    let updateInitialWeight = 0
    if("initial weight" in newData)
        updateInitialWeight = 1

    //Check validity of the initial weight update - if it returns true, there is an error, so stop the function
    if(updateInitialWeight) {
        if(us_checkInitialWeightValidity_(newData,id))
            return
    }

    //Update Intake sheet
    if ("Mother's Doctor" in newData) { //There is an update for mothers report
        let [intakeIndices, intakeDataById] = getData("INTAKE")
        intakeDataById[id].case_history[0][intakeIndices.mothers_doctor] = newData["Mother's Doctor"]
        delete newData["Mother's Doctor"]
        updateDataRowWithCasesById("INTAKE",intakeDataById,intakeIndices)
    }

    

    let [addIndices, addDataById] = getData("ADDRESSES")
    
    let addData
    if(addDataById[id] == undefined) {
        addDataById[id] = {}
        addData = []
        addDataById[id]["case_history"] = addData
        addDataById[id]["indices"] = addIndices
    }
    else
     addData = addDataById[id].case_history

    //Check if any existing addresses have been tweaked
    let addChanges = us_checkFieldChanges_(newData,oldData,"Address: ")
    for(let i=0; i<addChanges.length ; i++)
        addData[addChanges[i]-1][addIndices.address] = newData["Address: " + [addChanges[i]]]

    let blockChanges = us_checkFieldChanges_(newData,oldData,"Block: ")
    for(let i=0; i<blockChanges.length ; i++)
        addData[blockChanges[i]-1][addIndices.block] = newData["Block: " + [blockChanges[i]]]

    let addInfoChanges = us_checkFieldChanges_(newData,oldData,"Address Information: ")
    for(let i=0; i<addInfoChanges.length ; i++)
        addData[addInfoChanges[i]-1][addIndices.address_description] = newData["Address Information: " + addInfoChanges[i]]


    //Add New Address
    let newAdd = 0
    if ("New Address" in newData | "New Block" in newData  | "New Address Information" in newData) {
        
        let addRow = []
        addRow[addIndices.id_no] = id
        addRow[addIndices.entry_type] = "Update Sheet"
        let dt = new Date()
        dt.setHours(0,0,0,0)
        addRow[addIndices.date] = dt
        addRow[addIndices.address] = newData["New Address"] || ""
        addRow[addIndices.block] = newData["New Block"] || ""
        addRow[addIndices.address_description] = newData["New Address Information"] || ""
        addData.push(addRow)
        newAdd = 1
    }

    console.log(addData)
    if(addChanges.length > 0 | blockChanges.length > 0 | addInfoChanges.length > 0 | newAdd == 1)
        updateDataRowWithCasesById("ADDRESSES",addDataById,addIndices)

    let [staticIndices,staticDataById] = getData("STATIC")
    staticData = staticDataById[id].case_history

    //use update sheet to change status of phone numbers in the DBR phone number sheet - used address logic as above
    let [phoneIndices, phoneDataById] = getData("PHONE_NUMBERS")
    let phoneData 
    if(phoneDataById[id])
        phoneData = phoneDataById[id].case_history
    else {
        phoneDataById[id] = {}
        phoneData = []
        phoneDataById[id]["case_history"] = phoneData
        phoneDataById[id]["indices"] = phoneIndices
    }

    //Check phone number changes
    let phoneChanges = us_checkFieldChanges_(newData,oldData,"Phone Number: ")
    console.log(phoneChanges)
    for(let i=0; i<phoneChanges.length ; i++)
        phoneData[phoneChanges[i]-1][phoneIndices.phone_number] = newData["Phone Number: " + [phoneChanges[i]]]

    let descChanges = us_checkFieldChanges_(newData,oldData,"Description: ")
    for(let i=0; i<descChanges.length ; i++)
        phoneData[descChanges[i]-1][phoneIndices.description] = newData["Description: " + [descChanges[i]]]

    let statusChanges = us_checkFieldChanges_(newData,oldData,"Status: ")
    for(let i=0; i<statusChanges.length ; i++)
        phoneData[statusChanges[i]-1][phoneIndices.status] = newData["Status: " + statusChanges[i]]

    
    //Check new phone number
    let newPhone = 0
    if ("New Phone Number" in newData | "New Description" in newData | "New Status" in newData){
        let phoneRow = []
        phoneRow[phoneIndices.id_no] = id 
        phoneRow[phoneIndices.phone_number] = newData["New Phone Number"] || ""
        phoneRow[phoneIndices.description] = newData["New Description"] || ""
        phoneRow[phoneIndices.status] = newData['New Status'] || ""
        completeArray(phoneRow,phoneIndices)
        phoneData.push(phoneRow)
        newPhone = 1
    }
    
    
    staticData[0][staticIndices.phone_numbers] = getMergedPhoneNumbers_(phoneData, phoneIndices)

    console.log("Phone Numbers:", staticData[0][staticIndices.phone_numbers])
    
    //Check if primary phone number is changed, if it has changed then set the status in DBR phone number sheet to 'preferred'
    primPhone = 0
    if("Primary Phone No." in newData){
        let preferredPhNo = String(phoneData[newData["Primary Phone No."]-1][phoneIndices.phone_number])
        if(phoneData[newData["Primary Phone No."]-1][phoneIndices.description])
            preferredPhNo = `${preferredPhNo} (${phoneData[newData["Primary Phone No."]-1][phoneIndices.description]})`
        console.log("New preferred phone number:", preferredPhNo)
        staticData[0][staticIndices.primary_phone_number] = preferredPhNo

        //Change preferred status in phoneData
        console.log("Changing preferred status in column:", phoneIndices.preferred)
        console.log(phoneData)
        for(let i=0; i<phoneData.length; i++) {
            if (String(i+1) == String(newData["Primary Phone No."]))
                phoneData[i][phoneIndices.preferred] = 1
            else
                phoneData[i][phoneIndices.preferred] = 0
        }
        console.log(phoneData)
        primPhone = 1
    }

    //if a new phone number is added change its status in DBR phone number sheet to 'active'
    if(phoneChanges.length > 0 | descChanges.length > 0 | statusChanges.length > 0 | newPhone == 1 | primPhone == 1)
        updateDataRowWithCasesById("PHONE_NUMBERS",phoneDataById,phoneIndices)


    
    //Check if Address has changed
    if("Primary Address" in newData) {
        staticData[0][staticIndices.address] = addData[newData["Primary Address"]-1][addIndices.address]
        staticData[0][staticIndices.block] = addData[newData["Primary Address"]-1][addIndices.block]
    }

    
    //Check remaining fields
    for(attr in newData) {
        let att = parseColumn_(attr)
        if(att in staticIndices) {
            staticData[0][staticIndices[att]] = newData[attr]
        }
    }

    updateDataRowWithCasesById("STATIC",staticDataById,staticIndices)

    let basicInfo = getData("STATIC")[1]

    if(updateCAs) {
        let tabs = ["IN_HOSPITAL_TESTING","PHONE_HOME_TESTING", "FORMULA_ACTIVE_DBR", "COMPLIMENTARY_FEEDING_DBR"]
        for(let i=0; i<tabs.length; i++)
            updateCAbyTab(tabs[i],0,basicInfo)
        tabs = ["HOME_VISIT_ACTIVE_DBR","PRIORITY_CALLS_ACTIVE_DBR","OPD_VISITS_ACTIVE_DBR", "GRAD_SUGGESTIONS_DBR"]
        for(let i=0; i<tabs.length; i++)
            updateCAbyTab(tabs[i],1,basicInfo)
    }
    if(updateInitialWeight) {
        let tabs = ["HOME_VISIT_ACTIVE_DBR","PRIORITY_CALLS_ACTIVE_DBR","OPD_VISITS_ACTIVE_DBR", "GRAD_SUGGESTIONS_DBR","FORMULA_ACTIVE_DBR", "COMPLIMENTARY_FEEDING_DBR"] 
        updateStaticAttrsByTab(tabs,["initial_weight", "initial_weight_date"])
    }
    updateLog(id, oldData, newData);
    clearUpdateSheet(1)
   

}

function us_checkFieldChanges_(newData,oldData,field) {

    let maxNumber = us_getMaxNumber_(oldData, field)
    let changes = []
    for(let i =1; i<=maxNumber; i++) {
        if (field + i in newData)
            changes.push(i)
    }
    return changes
}

function us_checkInitialWeightValidity_(newData,id) {
    let ui = SpreadsheetApp.getUi()
    
    //Throw Error if no Initial Weight Date is entered
    if(!("initial weight date" in newData)) {
        ui.alert("No Initial Weight Date found", 
             "No Initial Weight Date entered. Please enter the Initial Weight Date if you wish to update the Initial Weight (even if it is the same as the current Initial Weight Date)", 
             ui.ButtonSet.OK);
        return true
    }

    
    
    let initialWeightDate = newData["initial weight date"]
    initialWeightDate.setHours(0,0,0,0) //Remove time, just in case it accidentally got entered

    
    let error = ""
    let updateSheets = 0
    let updateIndex = -1
    
    //Get In Hospital Date to check
    let inHospTab = "IN_HOSPITAL_TESTING"
    let [inHospIndices, inHospData] = getData(inHospTab)
    
    let inHospCaseHistory
    if(id in inHospData)
        inHospCaseHistory = inHospData[id].case_history
    else {
        inHospTab = "IN_HOSPITAL_ARCHIVE_TESTING"
        let archiveData =  getData(inHospTab)
        if(id in archiveData[1]) {       
            inHospData = archiveData[1]
            inHospIndices = archiveData[0]
            inHospCaseHistory = inHospData[id].case_history
        }
        else //Update Initial Weight in the Intake Sheet if no In hospital Data because this is an Out od Hospital Intake Baby
            updateSheets = 1
    }

    if(inHospCaseHistory) {
        for(let i=0; i<inHospCaseHistory.length; i++) {
            const weight = inHospCaseHistory[i][inHospIndices.weight]
            const typ = inHospCaseHistory[i][inHospIndices.type_of_form]
            let dt = inHospCaseHistory[i][inHospIndices.date]
            try {
                dt.setHours(0,0,0,0)
            } catch(e) {
                console.log("Cannot convert this value to date", dt)
                continue
            }
            

            //If entered initial weight date is less than intake date, give an error
            if(dt.valueOf() > initialWeightDate.valueOf() && typ == "intake") {
                errorTitle = "Initial Weight Date Earlier than Intake Date"
                error = `Intake Form filled out on ${dt}. Please ensure entered initial weight date is not earlier than the intake date.`
                break
            }


            //If the entered initial weight date is less than the current date, no need to check further
            if(dt.valueOf() > initialWeightDate.valueOf()) 
                break
            
            //If entered initial weight date is same as intake date is in hospital, need to update in-hospital and intake sheets
            if(dt.valueOf() == initialWeightDate.valueOf() && typ == "intake") {
                updateSheets = 1
                updateIndex = i
                break
            }
            
            //This is executed only when date is less than the entered initial weight
            if(String(weight).trim() != "" && dt.valueOf() < initialWeightDate.valueOf()) { //First non-empty weight found BEFORE the entered initial weight date
                errorTitle = "Weight Records earlier than entered Initial Weight Date found"
                error = `A weight of ${weight} was recorded on ${dt}.  Please check the weight trajectory and either edit it or enter a new initial weight date.`
                break
            }
        }
    }
    else {
        let intakeDate = getData("STATIC")[1][id].intake_date
        if(initialWeightDate.valueOf() < intakeDate.valueOf()) {
            errorTitle = "Initial Weight Date Earlier than Intake Date"
            error = `Intake Form filled out on ${intakeDate}. Please ensure entered initial weight date is not earlier than the intake date.`
            updateSheets = 0
        }
    }

    if (updateSheets) {
        //Update in Hospital
        if(inHospCaseHistory != undefined) {
            inHospCaseHistory[updateIndex][inHospIndices.weight] = newData["initial weight"]
            inHospData[id].case_history = inHospCaseHistory
            updateDataRowWithCasesById(inHospTab,inHospData,inHospIndices,1)
        }
        //Update Intake Sheet
        let [intakeIndices,intakeData] = getData("INTAKE")
        updateColumnsById_(intakeData,intakeIndices,[id],["weight"],[newData["initial weight"]])
        updateDataRowWithCasesById("INTAKE",intakeData,intakeIndices)
    }

    if(error) {
        ui.alert(errorTitle, error, ui.ButtonSet.OK);
        return true
    }
    
    return false
}

function us_getMaxNumber_(oldData, field) {
    let maxNumber = 0
    for(let i=1; i<=100; i++) {
        if(field + i in oldData)
            maxNumber = i
        else
            break
    }
    return maxNumber
}

function us_checkPrimaryFieldChange_(newData,oldData,field) {
    flag = 0 // 0 means no change
    if("Primary " + field in newData) {
        let maxNumber = us_getMaxNumber_(oldData,  field + ": ")
        let pPhoneNum = newData["Primary " + field]
        if( pPhoneNum <= maxNumber)
            flag = pPhoneNum
        else if(pPhoneNum == maxNumber + 1 && "New " + field in newData)
            flag = -1
        else
            throw `Enter Appropriate Primary Number for ${field}. Max Number Allowed: ${maxNumber}`
    }
    return flag
}

/**
 * This function updates the values of the provided attributes in the provided tabs using data from he basic information sheet.
 * For instance, if we would like to update ga_days and ga_weeks in formula and feeding tabs, the function will update the entire columns (ga_weeks and ga_days) in the formula feeding tab using the values for the respective ids in the basic information sheet. Therefore, the provided attributes must be present in the Basic Information Sheet
 * @param {String} nameArray - Names of the tabs to be updated in an array
 * @param {Array} attrs - Array of the attributes that need to be updated (Must be a part of the basic information (STATIC) sheet)
 * 
 */
function updateStaticAttrsByTab(nameArray,attrs) {

    let [basicIndices, basicInfo] = getData("STATIC")
    for(attr of attrs) {
        if (!(attr in basicIndices))
            throw `Cannot update ${attr}; It is not present in Basic Information. Please check the spelling from the hidden row of the basic information sheet.`
    }
    for(let i=0; i<nameArray.length; i++) {
        let name = nameArray[i]
        let [indices,,,data] = getData(name)
        let updatedSets = {}
        for(let attr of attrs) {
            let colIndex = indices[attr]
            if(colIndex == undefined) {
                console.log(`Cannot find ${attr} in ${nameArray[i]}`)
                continue
            }
            let updatedArray = []
            for(let j=0; j<data.length; j++) {
                const id = String(data[j][indices.id_no])
                let val = ""
                if(basicInfo[id] != undefined)
                    val = basicInfo[id][attr]
                else
                    console.warn("Cannot find data for ID:", id)
                updatedArray.push([val])
            }
                
            updatedSets[String(colIndex)] = updatedArray
        }

        let row = eval(name+"_HEADER_INDEX") + 2
        let tab = getTab_(name)
        for(let [colIndex, arr] of Object.entries(updatedSets))
            tab.getRange(row,parseInt(colIndex)+1,arr.length,1).setValues(arr)
    }
}

function getMergedPhoneNumbers_(phoneCaseHistory, phoneIndices) {

    let mergedPhoneNumbers = ""
    for(let i=0; i<phoneCaseHistory.length; i++) {
        if(i==0)
            mergedPhoneNumbers = mergedPhoneNumbers + String(phoneCaseHistory[i][phoneIndices.phone_number])
        else
            mergedPhoneNumbers = `${mergedPhoneNumbers},${phoneCaseHistory[i][phoneIndices.phone_number]}`

        if(phoneCaseHistory[i][phoneIndices.description])
            mergedPhoneNumbers = `${mergedPhoneNumbers} (${phoneCaseHistory[i][phoneIndices.description]})`

    }
    return mergedPhoneNumbers
}