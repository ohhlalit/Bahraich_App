
function getAllMissingAttributes() {
    
    
    let missingTabs = ["MISSING_BIRTHPLACE", "MISSING_BIRTHDAY", "MISSING_INITIAL_WEIGHT", "MISSING_PHONE_NUMBER", "MISSING_MOTHERS_DOCTOR", "MISSING_GA", "MISSING_SEX"]

    for(let i=0; i<missingTabs.length; i++) {
        getMissingDataByTab(missingTabs[i])
    }

    getMissingExits()
    getInconsistentBirthday()
    getInconsistentStatus()

}




function getMissingExits(numDays) {

    numDays = numDays || 3

    let [,activeCasesByID] = getData("IN_HOSPITAL_TESTING")
    let [,archiveCasesById] = getData("IN_HOSPITAL_ARCHIVE_TESTING")

    // let [,intakeCases] = getData("INTAKE")
    // let [,exitCases] = getData("EXIT")
    
    // let intakeIDs = Object.keys(intakeCases)
    // let exitIDs = Object.keys(exitCases)

    let inHospCases = Object.assign({}, archiveCasesById, activeCasesByID)

    let targetDate = new Date()
    targetDate.setHours(0,0,0,0)
    targetDate = targetDate.valueOf() - (1000*60*60*24*numDays) 

    let targetBday = new Date('2023-01-01')

    let formInclusions = ["exit","discharge","abscond","lama"]
    
    let missingIDs = []
    for(const [id, caseData] of Object.entries(inHospCases)) {
      
      

      if(caseData.date.valueOf() > targetDate)
        continue
      
      const caseHistory = caseData.case_history
      const caseIndices = caseData.indices
      
      if(caseData.reason_to_archive == "Died in ASMC" && caseData.birthday < targetBday)
        continue
      
      let hasExit = false

      for(let i=caseHistory.length-1; i>=0; i--) {
        
        const formType = caseHistory[i][caseIndices.type_of_form].toLowerCase()
        const babyLoc = String(caseHistory[i][caseIndices.where_is_the_baby_now]).toLowerCase()

        for(let j=0; j<formInclusions.length; j++) {
          if(formType.includes(formInclusions[j]) || babyLoc.includes(formInclusions[j])) {
            hasExit = true
            break
          }
        }
        if(hasExit)
          break
      }

      if(hasExit)
        continue
      else
        missingIDs.push(id)
    }


    let indices = getIndices("MISSING_EXIT")

    let data = []
    for(let i=0; i<missingIDs.length; i++) {
      let row = []
      for(const [attr, index] of Object.entries(indices))
        row[index] = inHospCases[missingIDs[i]][attr] || ""
      
      data.push(row)
    }

    updateDataRows("MISSING_EXIT",data,indices)

}


function getInconsistentBirthday() {

    let staticData = getData("STATIC")[1]

    let indices = getIndices("INCONSISTENT_BIRTHDAY")
    let data = []
    
    for(const [id, caseData] of Object.entries(staticData)) {

        if(String(caseData.birthday).trim() == "" || String(caseData.intake_date).trim() == "")
            continue
        let row = []
        if(caseData.birthday > caseData.intake_date) {
            for(const [attr, index] of Object.entries(indices))
                row[index] = caseData[attr]
            data.push(row)
        }
    }

    if(data.length > 0)
        updateDataRows("INCONSISTENT_BIRTHDAY",data,indices)
    else {
        data[indices.id_no] = "No ID with missing data found"
        updateDataRows("INCONSISTENT_BIRTHDAY",[data],indices,1)
    }
}

function getMissingDataByTab(tabname) {
    
    
    let varMapping = {"MISSING_BIRTHPLACE"     : "place_of_birth", 
                      "MISSING_BIRTHDAY"       : "birthday", 
                      "MISSING_INITIAL_WEIGHT" : "initial_weight", 
                      "MISSING_PHONE_NUMBER"   : "phone_numbers", 
                      "MISSING_MOTHERS_DOCTOR" : "mothers_doctor", 
                      "MISSING_GA"             : "ga_weeks", 
                      "MISSING_SEX"            : "female"
    }

    let staticData = getData("STATIC")[1]
    let variableCheckData
    if(tabname == "MISSING_BIRTHPLACE" || tabname == "MISSING_MOTHERS_DOCTOR")
        variableCheckData = getData("INTAKE")[1]
    else
        variableCheckData = staticData

    let indices = getIndices(tabname)
    let data = []
    for(const [id, caseData] of Object.entries(staticData)) {

        let row = []
        let missing = 0
        if(variableCheckData[id] == undefined)
            missing = 1
        else if(String(variableCheckData[id][varMapping[tabname]]).trim() == "")
            missing = 1
        if(missing) {
            for(const [attr, index] of Object.entries(indices))
                row[index] = caseData[attr]
            data.push(row)
        }
    }
    if(data.length > 0)
        updateDataRows(tabname,data,indices)
    else {
        data[indices.id_no] = "No ID with missing data found"
        updateDataRows(tabname,[data],indices,1)
    }

}

function getInconsistentStatus() {


    let indices = getIndices("INCONSISTENT_STATUS")

    let inHospCases = getData("IN_HOSPITAL_TESTING")[1]
    let inHospArchiveCases = getData("IN_HOSPITAL_ARCHIVE_TESTING")[1]

    let inHospIds = Object.keys(inHospCases)
    let inHospArchiveIds = Object.keys(inHospArchiveCases)

    let inHospInconsistentIds = inHospIds.filter(id => inHospArchiveIds.indexOf(id) > -1)

    
    let data = []
    
    for(let i=0; i<inHospInconsistentIds.length; i++) {
        let id = inHospInconsistentIds[i]
        let row = []
        for(const [attr, index] of Object.entries(indices)) {
            const val = inHospCases[id][attr]
            if(val != undefined)
                row[index] = val
            if(attr == "Statuses") {
                statuses = "Active, " + inHospArchiveCases[id].reason_to_archive + " (In Hospital)"
                row[index] = statuses
            }
        }
        data.push(row)
    }

    let phCases = getData("PHONE_HOME_TESTING")[1]
    let phArchiveCases = getData("PHONE_HOME_ARCHIVE_TESTING")[1]

    let phIds = Object.keys(phCases)
    let phArchiveIds = Object.keys(phArchiveCases)

    let phInconsistentIds = phIds.filter(id => phArchiveIds.indexOf(id) > -1)

    for(let i=0; i<phInconsistentIds.length; i++) {
        let id = phInconsistentIds[i]
        let row = []
        for(const [attr, index] of Object.entries(indices)) {
            const val = phCases[id][attr]
            if(val != undefined)
                row[index] = val
            if(attr == "Statuses") {
                statuses = "Active, " + phArchiveCases[id].reason_to_archive + " (Phone/Home)"
                row[index] = statuses
            }
        }
        data.push(row)
    }
    
    if(data.length > 0)
        updateDataRows("INCONSISTENT_STATUS",data,indices)
    else {
        data[indices.id_no] = "No IDs found with inconsistent statuses"
        updateDataRows("INCONSISTENT_STATUS",[data],indices,1)
    }
}