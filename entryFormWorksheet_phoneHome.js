
function efph_getWeightHistory(formDates, idArray, phCasesById,inHospCasesById,phIndices,inHospIndices) {
   // lookBackDays = lookBackDays || 3

    if(phCasesById == undefined) {
        const phData = getData("PHONE_HOME")
        phCasesById = phData[1]
        phIndices = phData[0]
    }
    if(inHospCasesById == undefined) {
        const inHospData = getData("IN_HOSPITAL")
        inHospCasesById = inHospData[1]
        inHospIndices = inHospData[0]
    }

    let [mergedIndices, mergedDataById] = mergeCaseHistoryData(inHospCasesById,inHospIndices,phCasesById, idArray)
    const ids = Object.keys(mergedDataById)
    
    let weightHistories = {}
    for(let i=0; i<ids.length; i++) {
        console.log(ids[i])
        let today = new Date()
        if (formDates != undefined)
          today = formDates[ids[i]] || today
        today.setHours(0,0,0,0)
        const caseHistory = mergedDataById[ids[i]].case_history
        let weightHistory = []
        for(let k = caseHistory.length-1; k>=0; k--) {
            const row = caseHistory[k]
            const dt = row[mergedIndices.date]
            const weight = row[mergedIndices.weight]
            const diff = (today - dt)/(1000*60*60*24)
            console.log(`Today: ${today}`)
            console.log(`Date: ${dt}`)
            console.log(`Diff: ${diff}`)
            if(diff == 0) {
                todayWeight = weight
                ca = row[mergedIndices.ca]
                initialWeight = row[mergedIndices.initialWeight]
                age = row[mergedIndices.age]
            }
            else if (diff > 0)
                weightHistory[diff-1] = weight
        }
        weightHistories[ids[i]] = weightHistory 
    }
    
    return weightHistories

}

function efph_getRecommendedKMC(todayWeight,ca) {
  
  //let [,,,weightGainValue] = drpt_computeWeightChanges_(todayWeight,initialWeight,weightHistory,age,lookBackDays)
  let weightGainValue
  return drpt_getRecommendedKMC_(todayWeight,weightGainValue,ca) 
}