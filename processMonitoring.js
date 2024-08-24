/**
 * Sends the emails about pending forms and updates the Process Monitoring Sheet
 */
function sendFormEmails() {
    updatePMData()
    const users = ["diane@riceinstitute.org", "bishnupriya@riceinstitute.org"]
    const subject = "New Process Monitoring Forms to be Filled"
    let htmlBody = "Hello,<br><br>" 
                   + "The following forms need to be filled out. <br><br>"
    
    const forms = ["DEATH", "UNREACHABLE", "REFUSAL", "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA","DO_NOT_FOLLOW_MEET_CRITERIA"]
    
    for(let i=0; i<forms.length; i++) {
        const numCases = getIDs("PROCESS_MONITORING_" + forms[i] + "_PENDING_IDS").length - getIDs("PROCESS_MONITORING_" + forms[i] + "_FORM_RESPONSES").length
        if (numCases > 0) {
          const formLink = `<a href='${eval("PROCESS_MONITORING_" + forms[i] + "_FORM_VIEW")}'> ${pms_getName(forms[i])} </a>`
          htmlBody = htmlBody + formLink + `(${numCases}) <br><br>`
        }
    }
    htmlBody = htmlBody + "Thanks"

    sendEmail(users,subject,htmlBody)
}



function makePMEntry(typeOfEntry, casesById, idArray, action, user) {

    let name = "PROCESS_MONITORING_" + typeOfEntry + "_PENDING_IDS"
    let indices = getData(name, 1)
    const timestamp = new Date()

    let data = []
    for(let i=0; i<idArray.length; i++) {
        const id = idArray[i]
        let row = []
        row[indices.id_no] = id
        const caseObj = casesById[id]
        if(caseObj == undefined)
            throw `Cannot find ID ${id} to enter in ${name}`
        
        row[indices.mother] = casesById[id].mother
        row[indices.father] = casesById[id].father
        row[indices.timestamp] = timestamp
        row[indices.action] = action
        row[indices.user] = user

        data.push(row)
    }

    insertData(name,-2,data,indices)

    if(typeOfEntry == "GRADUATED")
        insertData("PROCESS_MONITORING_" + typeOfEntry + "_FORM_RESPONSES",-2,data,indices)
    
    updateFormIDs("PROCESS_MONITORING_" + typeOfEntry)
}



/**
 * This function inserts new data in the process monitoring master sheet. It looks for any new ids that have been submitted in any of the five process monitoring submission forms.
 * If any new ids are found it inserts them at the top of the process monitoring sheet. While the form is running all form submissions are stopped.
 * Once the function is done running the form submissions are archived in their respective tabs and pending ids is updated.
 * Form submissions are resumed if there are any leftover pending ids and closed if no ids are left.
 */
function updatePMData() {
    
    //Stop all submissions to prevent any missing submission ( a submission coming in whil processing is done)
    pms_stopSubmissions()

    pms_changeIdMotherFatherToId()
    let indices = getData("PROCESS_MONITORING_MASTER",1)
    let caseDataById = convertCaseObjArrToDict_(getMergedDataForSideBar_dbr())
    
    //Get all Submissions
    let [gradSubIndices,gradSubs] = getData("PROCESS_MONITORING_GRADUATED_FORM_RESPONSES")
    let [deathSubIndices,deathSubs] = getData("PROCESS_MONITORING_DEATH_FORM_RESPONSES")
    let [unreachableSubIndices,unreachableSubs] = getData("PROCESS_MONITORING_UNREACHABLE_FORM_RESPONSES")
    let [doNotFollowDoesNotMeetCriteriaSubIndices,doNotFollowDoesNotMeetCriteriaSubs] = getData("PROCESS_MONITORING_DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA_FORM_RESPONSES")
    let [refusalSubIndices,refusalSubs] = getData("PROCESS_MONITORING_REFUSAL_FORM_RESPONSES")
    let [doNotFollowMeetCriteriaSubIndices,doNotFollowMeetCriteriaSubs] = getData("PROCESS_MONITORING_DO_NOT_FOLLOW_MEET_CRITERIA_FORM_RESPONSES")

    //Group Ids by submission type
    let typesAndIds = { "GRADUATED" : gradSubs,
                        "DEATH" : deathSubs,
                        "UNREACHABLE" : unreachableSubs,
                        "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA" : doNotFollowDoesNotMeetCriteriaSubs,
                        "REFUSAL" : refusalSubs,
                        "DO_NOT_FOLLOW_MEET_CRITERIA" : doNotFollowMeetCriteriaSubs
                      }

    let typeOfEntries = Object.keys(typesAndIds)
    let data = []
    for(let i=0; i<typeOfEntries.length; i++) {
        const typeOfEntry = typeOfEntries[i]
        const subs = typesAndIds[typeOfEntry] //Go through group of IDs by type (grad/death/refusal etc.)
        let dataByType = pms_addConstInfo_(subs, typeOfEntry, indices, caseDataById) //Add data common to all types of submission
        switch (typeOfEntry) { //Add type specific data

            case "GRADUATED":
                dataByType = pms_addGradInfo_(dataByType,indices,caseDataById)
                break

            case "DEATH":
                dataByType = pms_addDeathInfo_(dataByType,indices,deathSubs,deathSubIndices)
                break
            
            case "UNREACHABLE":
                dataByType = pms_addUnreachableInfo_(dataByType,indices,unreachableSubs,unreachableSubIndices)
                break
            
            case "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA":
                dataByType = pms_addDoNotFollowDoesNotMeetCriteriaInfo_(dataByType,indices,doNotFollowDoesNotMeetCriteriaSubs,doNotFollowDoesNotMeetCriteriaSubIndices)
                break
            
            case "REFUSAL":
                dataByType = pms_addRefusalInfo_(dataByType,indices,refusalSubs,refusalSubIndices)
                break

            case "DO_NOT_FOLLOW_MEET_CRITERIA":
                dataByType = pms_addDoNotFollowMeetCriteriaInfo_(dataByType,indices,doNotFollowMeetCriteriaSubs,doNotFollowMeetCriteriaSubIndices)
                break
            

        }
        
        data = [...data, ...dataByType]
    }
    
    for(let i=0; i<data.length; i++)
      data[i] = completeArray(data[i],indices) //Make sure all rows are concordant to the master data set
      
    console.log("Total number of rows entered:", data.length)
    insertData("PROCESS_MONITORING_MASTER",-2,data)

    pms_archiveSubmittedIds(typesAndIds)
}


/**
 * Adds basic information for the given ids for the process monitoring sheet
 * @param {Array} idArray -Array of Ids for which constant (irrespective of status) information is to be added
 * @param {String} typeOfEntry - Status of the baby (Graduated, died, unreachable etc.)
 * @param {Dict} indices - Indices of the Process Monitoring Sheet (PMS)
 * @param {Dict} caseDataById - Merged cases of all babies
 * @returns - data in 2d form for the corresponding IDs to be added in the process monitoring sheet
 */

function pms_addConstInfo_(subs, typeOfEntry, indices, caseDataById) {

    //Get form generated date from pending ids
    let formGeneratedData = getData("PROCESS_MONITORING_" + typeOfEntry + "_PENDING_IDS")[1]
    let idArray = Object.keys(subs)
    
    let data = []
    for(let i=0; i<idArray.length; i++) {
        let id = idArray[i]
        let row = []

        //Add date when entry was created and when form was filled
       
        row[indices.entry_creation_date] = formGeneratedData[id].timestamp //Pending id timestamp is when form was generated
        if(typeOfEntry != "GRADUATED") //No forms filled for GRADUATED entries (it's automatic, so skip this field)
            row[indices.form_filled_date] = subs[id].timestamp  //Form timestamp is when form was filled

        let inHospData
        try {
            inHospData = caseDataById[id].in_hospital_case_history
        } catch (e) {
            throw `Cannot find ID: ${id} in in-hospital Tab`
        }
        let inHospIndices = caseDataById[id].in_hospital_indices
        let phSource = caseDataById[id].phone_home_source_sheet
        let phIndices = caseDataById[id][phSource+"_indices"]
        let phCaseData = caseDataById[id][phSource+"_case_history"]
        
        row[indices.final_status] = typeOfEntry
        row[indices.participated] = (typeOfEntry == 'GRADUATED' || typeOfEntry == 'DEATH') ? '1': '0'
        row[indices.id_no] = id
        row[indices.mother] = inHospData[0][inHospIndices.mother]
        row[indices.father] = inHospData[0][inHospIndices.father]
        row[indices.female] = inHospData[0][inHospIndices.female]
        row[indices.birth_order] = inHospData[0][inHospIndices.birth_order]
        row[indices.phone_no] = inHospData[0][inHospIndices.phone_numbers]
        row[indices.ga] = inHospData[0][inHospIndices.ga_weeks] // GA weeks is assigned.
        row[indices.initial_weight] =inHospData[0][inHospIndices.initial_weight]
        row[indices.place_of_birth] = inHospData[0][inHospIndices.place_of_birth]
        row[indices.is_the_baby_inborn] = inHospData[0][inHospIndices.is_the_baby_inborn]
        
        //Add weight information
        const weightData = ms_getWeightData_(phCaseData,phIndices,inHospData,inHospIndices)
        if(row[indices.initial_weight] ==""){
            row[indices.initial_weight] = weightData.initialWeightData.weight != -1 ? weightData.initialWeightData.weight : "."
        }
        row[indices.last_weight] = weightData.lastWeightData.weight != -1 ? weightData.lastWeightData.weight : row[indices.initial_weight]
        row[indices.last_weight_date] = weightData.lastWeightData.date != -1 ? weightData.lastWeightData.date : ""
        
        let multiple = inHospData[0][inHospIndices.twin_id]
        row[indices.twin_id] = multiple
        if(multiple == 0){
          row[indices.multiple] = "No"
        }else{
          row[indices.multiple] = "Yes"
        }
        row[indices.birthday] = new Date(inHospData[0][inHospIndices.birthday])

          
        row[indices.intake_date] = extractIntakeDateFromId_(id) 
        
        //Get other static variables

        //Room counters
        let condition = [{columnIndex: inHospIndices.type_of_form, matchArray: ["KMC stepdown", "case sheet"], partialMatch: 0},
                         {columnIndex: inHospIndices.where_is_the_baby_now, matchArray: ["SNCU"]}]
        row[indices.nights_in_sncu] = conditionCounter_(inHospData, condition,allTrue=1,inHospIndices.date) //Check the index, it would be something longer/smaler than nights_in_kmc (can change using hidden row, like in doctor's report)
        //Similarly add other room counters

        //We can keep using the same condition variable (less overload), there isn't any re-using of the variable anyway and you can also just copy paste the RHS repeatedly without having to change numbers
        condition = [{columnIndex: inHospIndices.type_of_form, matchArray: ["KMC stepdown", "case sheet"], partialMatch: 0},
                         {columnIndex: inHospIndices.where_is_the_baby_now, matchArray: ["307","309","corridor/lift/lobby","ayushman","Ayushman","Ayush","labour wards","3rd floor","IIIrd Floor","4th floor"]}]
        row[indices.nights_in_pnc] = conditionCounter_(inHospData, condition,allTrue=1,inHospIndices.date)
        // ayushman, IIIrd Floor,Ayush

        
        condition = [{columnIndex: inHospIndices.type_of_form, matchArray: ["KMC stepdown", "case sheet"], partialMatch: 0},
                         {columnIndex: inHospIndices.where_is_the_baby_now, matchArray: ["KMC7", "KMC10","KMC","MNCU"]}]
        row[indices.nights_in_kmc] = conditionCounter_(inHospData, condition,allTrue=1,inHospIndices.date)



        //Use phone home data to count number of home visits
        //Get exits array
        let exits = []
        let deathDate
        for(let j=0; j<inHospData.length; j++) {
            let babyRoom = String(inHospData[j][inHospIndices.where_is_the_baby_now])
            if(babyRoom.indexOf("exit") > -1) {
                let exitObj = {}
                exitObj['type'] = babyRoom.substring(5)
                exitObj['weight'] = inHospData[j][inHospIndices.weight]
                exitObj['date'] = new Date(inHospData[j][inHospIndices.date])
                if(verifyUniqueObj_(exitObj, exits)) //To remove any duplicate entries
                    exits.push(exitObj)
            }
            if(babyRoom.toLowerCase().indexOf("death") > -1)
                deathDate = new Date(inHospData[j][inHospIndices.date])
        }

        //First exit is in index 0
        /*
        i tried comapring just date but it not working properly first need to understand this work to use the simplied version instead of if else statement.

        row[indices.first_exit_type] = exits[0]?.type 
          row[indices.first_exit_weight] = exits[0]?.weight
          row[indices.alive_first_exit] = exits[0]?.date < deathDate ? 1 : 0
            
          row[indices.second_exit_type] = exits[1]?.type
          row[indices.second_exit_weight] = exits[1]?.weight
          row[indices.alive_second_exit] = exits[1]?.date < deathDate ? 1 : 0
            
          row[indices.third_exit_type] = exits[2]?.type
          row[indices.third_exit_weight] = exits[2]?.weight
          row[indices.alive_third_exit] =  exits[2]?.date < deathDate ? 1 : 0
          console.log("checking innn",exits[2]?.date,"<",deathDate, exits[2]?.date < deathDate)

        */

        if (exits.length > 0) {
          row[indices.first_exit_type] = exits[0]?.type 
          row[indices.first_exit_weight] = exits[0]?.weight
          row[indices.alive_first_exit] = (!(exits[0].date > deathDate))?1:0
          if (exits.length > 1) {
            row[indices.second_exit_type] = exits[1].type
            row[indices.second_exit_weight] = exits[1].weight
            row[indices.alive_second_exit] = 1
            if (exits.length > 2) {
              row[indices.third_exit_type] = exits[2].type
              row[indices.third_exit_weight] = exits[2].weight
              row[indices.alive_third_exit] = 1
            }
            else if (deathDate !== undefined){
              row[indices.alive_third_exit] = 0
            }
          }
          else if (deathDate !== undefined){
            row[indices.alive_second_exit] = 0
          }
        }
        else if (deathDate !== undefined){
          row[indices.alive_first_exit] = 0
        }
          
        
        //Use death date to infer alive dummies
        //Enter other exits and alive status

        //Other information using phone/home data
        condition = [{columnIndex: phIndices.type, matchArray: ["home"], partialMatch: 0}]
        row[indices.no_home_visits] = conditionCounter_(phCaseData, condition,1,phIndices.date)


        // i don't know how unreachable how will get tiggered assuming it will be triggered from a phone/home entry. unreachable_last_date will record the second last entry. if not just change the -2 to -1. also phone/home has exit entry so no need to check inhospital data but still included it. let me know if that's incorrect.
        
        //You can simply look for the last date in phone home and depending on what the status is assign it
        let lastphDate = new Date(phCaseData[phCaseData.length-1][phIndices.date])
        row[indices.unreachable] = (row[indices.final_status] == "UNREACHABLE") ? 1:0
        if(row[indices.unreachable])
          row[indices.unreachable_last_date] = lastphDate // * row[indices.unreachable] || ""

        row[indices.refusal] = (row[indices.final_status] == "REFUSAL") ? 1:0
        if(row[indices.refusal])
          row[indices.refusal_last_date] = lastphDate //* row[indices.refusal] || ""
        
        row[indices.do_not_follow] = (row[indices.final_status] == "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA") ? 1:0
        if(row[indices.do_not_follow])
          row[indices.do_not_follow_last_date]= lastphDate //* row[indices.do_not_follow] || ""
        

        row[indices.do_not_follow] = (row[indices.final_status] == "DO_NOT_FOLLOW_MEET_CRITERIA") ? 1:0
        if(row[indices.do_not_follow])
          row[indices.do_not_follow_last_date]= lastphDate //* row[indices.do_not_follow] || ""
        
        data.push(row)
    }
    return data
}
/**
 * Adds information for graduated babies
 * @param {Array} data - Existing data array to be inserted in PMS
 * @param {Dictionary} indices - Indices of the PMS
 * @param {Dictionary} caseDataById - Merged cases for all babies
 * @returns - data in 2D format with graduated relevant columns added
 */
function pms_addGradInfo_(data, indices, caseDataById) {

    let [,formulaActiveCases] = getData("FORMULA_ACTIVE_DBR")
    let [,gradResolvedCases] = getData("GRAD_RESOLVED_DBR")

    for(let i=0; i<data.length; i++) {
        let row = data[i]
        const id = String(row[indices.id_no]) //Dictionary contains string ids, so we need to make sure id is string
        
        const phSource = caseDataById[id].phone_home_source_sheet
        const phIndices = caseDataById[id][phSource+"_indices"]
        const phCaseData = caseDataById[id][phSource+"_case_history"]

        const inHospIndices = caseDataById[id]["in_hospital_indices"]
        const inHospCaseData = caseDataById[id]["in_hospital_case_history"]

        
        //CHECK FEED TYPE INDEX
        row[indices.grad_feed_type] = phCaseData[phCaseData.length-1][phIndices.feed_type]
        
        row[indices.formula] = (id in Object.keys(formulaActiveCases)) ? 1:0
        const formulaData = formulaActiveCases[id]
        if(row[indices.formula])
            row[indices.given_formula] = (formulaData.self_yes_no == "No") ? 1:0
        else
            row[indices.given_formula] = "."
        
        
        
        const weightData = gs_getWeightData_(phCaseData,phIndices,inHospCaseData,inHospIndices)
        row[indices.weight_40w] = weightData.last40WData.weight != -1 ? weightData.last40WData.weight : ""
        row[indices.weight_source_40w] = weightData.last40WData.source
        row[indices.weight_date_40w] = weightData.last40WData.date != -1 ? weightData.last40WData.date : ""
        row[indices.weight_44w] = weightData.lastWeightData.weight != -1 ? weightData.lastWeightData.weight : ""
        row[indices.weight_source_44w] = weightData.lastWeightData.source
        row[indices.weight_date_44w] = weightData.lastWeightData.date != -1 ? weightData.lastWeightData.date: ""

        const weightGain = gs_getWeightGainData_(weightData)
        row[indices.gm_kg_day] = weightGain.bw_birth_and_44W
        row[indices.gm_day] = weightGain.bw_40W_and_44W
        
        //WE PROBABLY NEED A DAY STATUS WAS UPDATED TO BE DIRECTLY PICKED UP WHEN PARSING DATA
        
        row[indices.grad_date] = new Date(phCaseData[phCaseData.length-1][phIndices.date])
        row[indices.limits] = (gradResolvedCases[id].grad_status == 5) ? 1:0
        const bday = phCaseData[0][phIndices.birthday]
        row[indices.age_at_grad] = Math.round((row[indices.grad_date] - bday) / (1000*60*60*24*7))
        row[indices.ca_at_grad] = row[indices.age_at_grad] + inHospCaseData[0][inHospIndices.ga_weeks]
        row[indices.alive_28d] = (phSource == "grad") ? 1:0 //Implies the baby graduated
        row[indices.alive_44w] = (phSource == "grad") ? 1:0
        
        data[i] = row
    }

    return data
}

/**
 * Adds information for dead babies
 * @param {Array} data - Existing data array to be inserted in PMS
 * @param {Dictionary} indices - Indices of the PMS
 * @param {Dictionary} caseDataById - Merged cases for all babies
 * @returns - data in 2D format with dead relevant columns added
 */

function pms_addDeathInfo_(data, indices, deathSubs, deathSubIndices) {

    
    
    for(let i=0; i<data.length; i++) {
        
        let row = data[i]
        let id = row[indices.id_no] // removed String()

        const inc24h = deathSubs[id].was_the_baby_observed_to_live_for_at_least_24_hours_on_neither_oxygen_nor_iv_fluids
        const inc48h = deathSubs[id].was_the_baby_observed_to_live_for_at_least_48_hours_on_neither_oxygen_nor_iv_fluids
        const deathDate = deathSubs[id].what_is_the_date_of_death
        const exactDate = deathSubs[id].is_this_an_exact_date_or_an_estimate
        const placeOfDeath = deathSubs[id].what_is_the_place_of_death
        const aliveGrad = deathSubs[id].was_the_baby_alive_at_graduation_from_the_program
        const lastMilkType = deathSubs[id].what_type_of_milk_was_the_baby_receiving_at_the_time_of_death_please_check_all_that_apply
        const lastFeedMode = deathSubs[id].what_was_the_babys_feeding_mode_at_the_time_of_death
        const everAnimalMilk = deathSubs[id].was_the_baby_ever_fed_animal_milk_according_to_the_program_notes
        const everFormula = deathSubs[id].was_the_baby_ever_fed_formula_according_to_the_program_notes
        const givenFormulaDied = deathSubs[id].did_the_project_provide_the_formula
        const breastmilk = deathSubs[id].was_the_baby_fed_breastmilk_in_addition_to_formula_in_the_week_before_death
        const mainMilk = deathSubs[id].what_was_the_main_type_of_milk_fed_to_the_baby_in_the_week_before_death
        const breastfeed = deathSubs[id].did_the_baby_ever_meet_the_majority_of_her_requirement_by_feeding_from_the_breast_before_death
        const deathDescription = deathSubs[id].please_describe_the_circumstances_of_the_childs_death_in_up_to_five_sentences_please_provide_longer_descriptions_for_babies_who_participated_in_the_program_beyond_their_sncu_stays

        
        //PG: Remove if the symptom question isn't added back by 16/09/2023
        // const fever = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_fever
        // const hypothermia = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_hypothermia
        // const feedingRefusal = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_feeding_refusal
        // const looseStools = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_loose_stools
        // const fastBreathing = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_fast_breathing
        // const chestIndrawing = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_chest_indrawing
        // const convulsions = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_convulsions
        // const umbilicalInfection = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_umbilical_infection
        // const injury = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_injury
        // const jaundice = deathSubs[id].were_the_following_symptoms_present_in_the_24_hours_before_death_jaundice
        // row[indices.fever] = fever
        // row[indices.hypothermia] = hypothermia
        // row[indices.feeding_refusal] = feedingRefusal
        // row[indices.loose_stools] = looseStools
        // row[indices.fast_breathing] = fastBreathing
        // row[indices.chest_indrawing] = chestIndrawing
        // row[indices.convulsions] = convulsions
        // row[indices.umbilical_infection] = umbilicalInfection
        // row[indices.injury] = injury
        // row[indices.jaundice] = jaundice

        row[indices.inc_24h] = inc24h
        row[indices.inc_48h] = inc48h
        row[indices.death_date] = deathDate
        row[indices.exact_date] = exactDate
        row[indices.place_of_death] = placeOfDeath
        row[indices.alive_grad] = aliveGrad
        row[indices.last_milk_type] = lastMilkType
        row[indices.last_feed_mode] = lastFeedMode
        row[indices.ever_animal_milk] = everAnimalMilk
        row[indices.ever_formula] = everFormula
        row[indices.given_formula_died]= givenFormulaDied
        row[indices.breastmilk] = breastmilk
        row[indices.main_milk] = mainMilk
        row[indices.breastfeed] = breastfeed
        row[indices.death_description] = deathDescription        


        //Calculate age at death
        const age_death_days = (row[indices.death_date].valueOf() - row[indices.birthday].valueOf())/(1000*60*60*24)
        row[indices.alive_28d] = age_death_days > 28 ? 1:0
        row[indices.alive_44w] = age_death_days > 44*7 ? 1:0
        
        data[i] = row
    }
    return data
}

/**
 * Adds information for unreachable babies
 * @param {Array} data - Existing data array to be inserted in PMS
 * @param {Dictionary} indices - Indices of the PMS
 * @param {Dictionary} caseDataById - Merged cases for all babies
 * @returns - data in 2D format with unreachable relevant columns added
 */

function pms_addUnreachableInfo_(data, indices,unreachableSubs,unreachableSubIndices) {
    
    for(let i=0; i<data.length; i++) {
        
        let row = data[i]
        let id = String(row[indices.id_no])

        const unreachableQuestions = unreachableSubs[id].why_did_the_family_refuse_to_participate_in_the_program
        const effortsToContact = unreachableSubs[id].please_describe_the_main_reason_for_refusal_in_your_own_words
        const unreachableDecision = unreachableSubs[id].please_describe_any_secondary_reasons_for_refusal
        const inc24h = unreachableSubs[id].was_the_baby_observed_to_live_for_at_least_24_hours_on_neither_oxygen_nor_iv_fluids
        const inc48h = unreachableSubs[id].was_the_baby_observed_to_live_for_at_least_48_hours_on_neither_oxygen_nor_iv_fluids

        row[indices.unreachable_questions] = unreachableQuestions
        row[indices.efforts_to_contact] = effortsToContact
        row[indices.unreachable_decision] = unreachableDecision
        row[indices.inc_24h] = inc24h
        row[indices.inc_48h] = inc48h

        data[i] = row
    }
    return data
}

/**
 * Adds information for refusal babies
 * @param {Array} data - Existing data array to be inserted in PMS
 * @param {Dictionary} indices - Indices of the PMS
 * @param {Dictionary} caseDataById - Merged cases for all babies
 * @returns - data in 2D format with Refusal relevant columns added
 */
function pms_addRefusalInfo_(data, indices,refusalSubs,refusalSubIndices) {

    
    
    for(let i=0; i<data.length; i++) {
        let row = data[i]
        let id = String(row[indices.id_no])

        const refusalReason = refusalSubs[id].why_did_the_family_refuse_to_participate_in_the_program
        const refusalReasonMain = refusalSubs[id].please_describe_the_main_reason_for_refusal_in_your_own_words
        const refusalReasonSecondary = refusalSubs[id].please_describe_any_secondary_reasons_for_refusal
        const inc24h = refusalSubs[id].was_the_baby_observed_to_live_for_at_least_24_hours_on_neither_oxygen_nor_iv_fluids
        const inc48h = refusalSubs[id].was_the_baby_observed_to_live_for_at_least_48_hours_on_neither_oxygen_nor_iv_fluids

        row[indices.inc_24h] = inc24h
        row[indices.inc_48h] = inc48h
        row[indices.refusal_reason] = refusalReason
        row[indices.refusal_reason_main] = refusalReasonMain
        row[indices.refusal_reason_secondary] = refusalReasonSecondary


        data[i] = row
    }
    return data
}

/**
 * Adds information for Do Not Follow babies
 * @param {Array} data - Existing data array to be inserted in PMS
 * @param {Dictionary} indices - Indices of the PMS
 * @param {Dictionary} caseDataById - Merged cases for all babies
 * @returns - data in 2D format with Do Not Follow relevant columns added
 */
function pms_addDoNotFollowDoesNotMeetCriteriaInfo_(data, indices,doNotFollowDoesNotMeetCriteriaSubs,doNotFollowDoesNotMeetCriteriaSubIndices) {

    
    for(let i=0; i<data.length; i++) {
        let row = data[i]
        let id = String(row[indices.id_no])

        const inc24h = doNotFollowDoesNotMeetCriteriaSubs[id].was_the_baby_observed_to_live_for_at_least_24_hours_on_neither_oxygen_nor_iv_fluids
        const inc48h = doNotFollowDoesNotMeetCriteriaSubs[id].was_the_baby_observed_to_live_for_at_least_48_hours_on_neither_oxygen_nor_iv_fluids

        row[indices.inc_24h] = inc24h
        row[indices.inc_48h] = inc48h
        row[indices.intake_reason_main] = doNotFollowDoesNotMeetCriteriaSubs[id].why_did_the_program_intake_this_baby_in_the_hospital
        row[indices.intake_reason_other] = doNotFollowDoesNotMeetCriteriaSubs[id].please_describe_the_other_reason
        row[indices.support_received] = doNotFollowDoesNotMeetCriteriaSubs[id].please_describe_the_support_the_baby_received_in_the_hospital_in_up_to_three_sentences
        row[indices.reason_not_followed_at_home] = doNotFollowDoesNotMeetCriteriaSubs[id].which_best_describes_why_the_family_was_not_followed_at_home
        row[indices.reason_not_followed_detail] = doNotFollowDoesNotMeetCriteriaSubs[id].please_describe_the_reason_why_the_baby_is_not_being_followed


        data[i] = row
    }
    return data
}


function pms_addDoNotFollowMeetCriteriaInfo_(data,indices,doNotFollowMeetCriteriaSubs,doNotFollowMeetCriteriaSubIndices){
    
    for(let i=0; i<data.length; i++) {
          let row = data[i]
          let id = String(row[indices.id_no])
          
          const inc24h = doNotFollowMeetCriteriaSubs[id].was_the_baby_observed_to_live_for_at_least_24_hours_on_neither_oxygen_nor_iv_fluids
          const inc48h = doNotFollowMeetCriteriaSubs[id].was_the_baby_observed_to_live_for_at_least_48_hours_on_neither_oxygen_nor_iv_fluids
          
          row[indices.inc_24h] = inc24h
          row[indices.inc_48h] = inc48h
          row[indices.support_received] = doNotFollowMeetCriteriaSubs[id].please_describe_the_support_the_baby_received_in_the_hospital_in_up_to_three_sentences
          row[indices.reason_not_followed_detail] = doNotFollowMeetCriteriaSubs[id].this_baby_meets_the_criteria_but_the_team_is_not_following_the_baby_at_home_please_explain_why_not


          data[i] = row
      }
      return data
}




function pms_changeIdMotherFatherToId() {
    const forms = ["GRADUATED", "DEATH", "UNREACHABLE", "REFUSAL", "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA","DO_NOT_FOLLOW_MEET_CRITERIA"]
    
    for(let i=0; i<forms.length; i++) {
        console.log("Changing ID:Mother:Father to ID for processing Forms of Type:", forms[i])
        const name = "PROCESS_MONITORING_" + forms[i] + "_FORM_RESPONSES"
        let [indices,,,rawData] = getData(name)
        for(let j=0; j<rawData.length; j++) {
            let idMF = String(rawData[j][indices.id_no])
            const lastIndex = idMF.indexOf(":")
            let id
            if(lastIndex == -1)
                id = idMF
            else
                id = idMF.substring(0,lastIndex)
            rawData[j][indices.id_no] = id
        }
        updateDataRows(name,rawData,indices)
    }
}

function pms_stopSubmissions() {
    const forms = ["GRADUATED", "DEATH", "UNREACHABLE", "REFUSAL", "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA","DO_NOT_FOLLOW_MEET_CRITERIA"]
    
    for(let i=0; i<forms.length; i++) {
        const name = "PROCESS_MONITORING_" + forms[i]
        changeFormAcceptingResponses(name,false)
    }
}


function pms_getName(codeName) {

    let name = codeName.substring(0,1) + codeName.substring(1,codeName.length).toLowerCase()
    name = name.replaceAll("_", " ")
    name = name + "Form"
    return name
}

function pms_archiveSubmittedIds(typesAndIds) {

    const typesOfEntries = Object.keys(typesAndIds)
    for(let i=0; i<typesOfEntries.length; i++) {
        const typeOfEntry = typesOfEntries[i]
        const idArray = Object.keys(typesAndIds[typeOfEntry])
        
        //Archive submissions
        let srcSheet = "PROCESS_MONITORING_"+typeOfEntry+"_FORM_RESPONSES"
        let destSheet = "PROCESS_MONITORING_"+typeOfEntry+"_FORMS_PROCESSED"
        
        archiveCasesWithTimeStamp(srcSheet, destSheet, idArray)
        
        //Archive ids
        srcSheet = "PROCESS_MONITORING_"+typeOfEntry+"_PENDING_IDS"
        destSheet = "PROCESS_MONITORING_"+typeOfEntry+"_PROCESSED_IDS"
        archiveCasesWithTimeStamp(srcSheet, destSheet, idArray)
        
        //Update form IDs once processing is completed
        updateFormIDs("PROCESS_MONITORING_"+typeOfEntry)
    }
}


function verifyUniqueObj_(currentObj, objArray) {

    const attrs = Object.keys(currentObj)
    let unique = 1
    for(let i=0; i<objArray.length; i++) {
        const obj = objArray[i]
        let currMatch = 1
        for(let j=0; j<attrs.length; j++) {
            if(currentObj[attrs[j]] != obj[attrs[j]]) {
                currMatch = 0
                break
            }
        }
        if(currMatch) {
            unique = 0
            break
        }
    }

    return unique
}



function pms_temp_addDates() {
    let [pmIndices,,,pmData] = getData("PROCESS_MONITORING_MASTER")
    
    const forms = ["GRADUATED", "DEATH", "UNREACHABLE", "REFUSAL", "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA","DO_NOT_FOLLOW_MEET_CRITERIA"]
    let formsData = []
    let formsGenerationData = []
    for(let i=0; i<forms.length; i++) {
        let formData = getData("PROCESS_MONITORING_"+forms[i]+"_FORMS_PROCESSED")[1]
        let formGenerationData = getData("PROCESS_MONITORING_"+forms[i]+"_PROCESSED_IDS")[1]

        formsData[i] = formData
        formsGenerationData[i] = formGenerationData
    }
    
    for(let i=0; i<forms.length; i++) {
        console.log("Added Data for Form Type", forms[i])
        console.log("Form IDs:", Object.keys(formsData[i]))
        console.log("Form Generation IDs:", Object.keys(formsGenerationData[i]))
    }

    for(let i=0; i<pmData.length; i++) {
        console.log(pmData[i])
        let id = String(pmData[i][pmIndices.id_no])
        let typ = pmData[i][pmIndices.final_status]

        let index = forms.indexOf(typ)
        if (index == -1)
          throw `Cannot find any form type for id: ${id}`

        if (formsData[index][id] == undefined) {
          console.warn (`Cannot find any filled forms data for id: ${id} with index: ${index} and type: ${typ}`)
          continue
        }
        
        if (formsGenerationData[index][id] == undefined) {
          console.warn(`Cannot find any processed ids data for id: ${id}`)
          continue
        }
        
        pmData[i][pmIndices.entry_creation_date] = formsGenerationData[index][id].timestamp
        if(typ != "GRADUATED")
            pmData[i][pmIndices.form_filled_date] = formsData[index][id].timestamp

    }

    updateDataRows("PROCESS_MONITORING_MASTER",pmData,pmIndices)

}