// IN HOSPITAL PARSING SUBMISSIONS //


function parseInHospitalSubmissions(){
    
    let globalVars = efw_getGlobalVars()
  
    console.log("Parsing In Hospital Submissions")
    clearExportSheets()
    
    let [indices,,,submissions] = getData("IN_HOSPITAL_SUBMISSIONS")
    inHospitalSubIndex = indices
    
    submissions = capitalizeTwinIds(submissions)
    console.log("Capitalized Twin IDs")
  
    //Need to sort submissions by twinID and birth order of baby..so resulting order should be A1,A2,B1,B2..with A, B being twin IDs and 1,2 birth orders of the babies
    let orderKey = [{column: inHospitalSubIndex.twin_id, ascending: true, blanksAtBottom: true}, {column: inHospitalSubIndex.birth_order_of_a_baby, ascending: true, blanksAtBottom: true}]
    submissions = sortData(submissions,orderKey)
  
    let staticEntries = parseStaticData()
    let [latestEntries, nextTwinId, entryCountByDate] = parseInHospitalMasterSheet()
    let latestAddresses = parseAddresses()
    let latestPhoneHome = parsePhoneHomeMasterSheet() 
    console.log("Set all Indices")
  
    console.log(`Parsing ${submissions.length} submissions`)
    for(let i = 0; i < submissions.length; i++){
      
      sub = submissions[i]
      let type = sub[inHospitalSubIndex.type_of_form]
  
      if(type === '') continue
  
      let incrementTwinId
      let id
      
      switch (type){
        case 'intake': 
          console.log(`Processing a ${type} form`)
          let prevSub = submissions[i - 1]
          
          let intakeDate = sub[inHospitalSubIndex.date]
          intakeDate.setHours(0,0,0,0)
          intakeDate = intakeDate.valueOf()
  
          let entryCountForIntakeDate = entryCountByDate[intakeDate] || 0 //See which number entry is this to generate reference id
  
          let prevEntry = globalVars.inHospitalExportable[globalVars.inHospitalExportable.length - 1]
          let data = parseIntake(globalVars, sub, prevEntry, nextTwinId, entryCountForIntakeDate, prevSub)
  
          incrementTwinId = data[0]
          entryCountByDate[intakeDate] = entryCountForIntakeDate + 1
        break
  
        case 'case sheet': 
          id = sub[inHospitalSubIndex.ref_id_case_sheet]
          console.log(`Processing ID No: ${id} as a ${type} form`)
          if (latestEntries[id] == undefined)
            throw `Cannot parse ${type} form for ${id}. It is not found in in-hospital. Please ensure the baby has been intaked and exists in in-hospital`
          parseCaseSheet(globalVars, sub, latestEntries[id])
        break
  
        case 'exit': 
          id = sub[inHospitalSubIndex.ref_id_exit]
          console.log(`Processing ID No: ${id} as a ${type} form`)
          if (latestEntries[id] == undefined)
            throw `Cannot parse ${type} form for ${id}. It is not found in in-hospital. Please ensure the baby has been intaked and exists in in-hospital`
          parseExit(globalVars, sub, latestEntries[id], latestAddresses[id])
        break
        case 'reintake': 
          id = sub[inHospitalSubIndex.ref_id_reintake]
          console.log(`Processing ID No: ${id} as a ${type} form`)
          if (latestEntries[id] == undefined)
            throw `Cannot parse ${type} form for ${id}. It is not found in in-hospital. Please ensure the baby has been intaked and exists in in-hospital`
          parseReintake(globalVars, sub, latestEntries[id], latestPhoneHome[id])
        break
        case 'KMC stepdown': 
          id = sub[inHospitalSubIndex.ref_id_kmc_stepdown]
          console.log(`Processing ID No: ${id} as a ${type} form`)
          if (latestEntries[id] == undefined)
            throw `Cannot parse ${type} form for ${id}. It is not found in in-hospital. Please ensure the baby has been intaked and exists in in-hospital`
          parseKmcStepdown(globalVars, sub, latestEntries[id])
        break
      }
  
      if(incrementTwinId){
        nextTwinId = nextTwinId + 1
      }
    }
  
    insertData("IN_HOSPITAL_EXPORT",-1,globalVars.inHospitalExportable,globalVars.inHospitalMasterIndex)
    insertData("PHONE_HOME_EXPORT",-1,globalVars.phoneHomeExportable,globalVars.phoneHomeMasterIndex)
    insertData("ADDRESS_EXPORT",-1,globalVars.addressExportable,globalVars.addressMasterIndex)
  
    exportInHospitalData()
  }
  
  
  function parseIntake(globalVars, sub, prevEntry, nextTwinId, entryCountIntakeDate, prevSub) {
  
      console.log("Parsing Intake")
  
      let typeOfForm = sub[inHospitalSubIndex.type_of_form]
      let mother = sub[inHospitalSubIndex.mother]
      let father = sub[inHospitalSubIndex.father]
      let birthday = sub[inHospitalSubIndex.birthday]
      let isFemale = sub[inHospitalSubIndex.is_the_baby_female]
      
      //Function to join phone number and notes for the phone number
      let joinNumToNotes = function (num, notes, order) {
        if(num === undefined || num === "") return
        if(notes === undefined || notes === "") return `${num} (${order} number)`
  
        return `${num} (${notes})`
      }
  
      let phoneNumbers = [
        joinNumToNotes(
          sub[inHospitalSubIndex.phone_number_a],
          sub[inHospitalSubIndex.notes_for_phone_number_a],
        "First"),
        joinNumToNotes(
          sub[inHospitalSubIndex.phone_number_b],
          sub[inHospitalSubIndex.notes_for_phone_number_b],
          "Second"
        ),
        joinNumToNotes(
          sub[inHospitalSubIndex.phone_number_c],
          sub[inHospitalSubIndex.notes_for_phone_number_c],
          "Third"
        ), 
      ]
  
      //Get all number joined along with their notes (who number belongs to etc.)
      let phoneNumberA = phoneNumbers[0] || ""
      let phoneNumberB = phoneNumbers[1] || ""
      let phoneNumberC = phoneNumbers[2] || ""
      let allPhoneNumbers = phoneNumbers.filter(num => num !== undefined && num != "" && num != " ").join(', ');
      
      let initialWeight = sub[inHospitalSubIndex.initial_weight]
      let intakeDate = sub[inHospitalSubIndex.date]

      let notes = sub[inHospitalSubIndex.notes]
      let intakeWhereIsBaby = sub[inHospitalSubIndex.where_is_the_baby_at_the_time_of_intake]
      
      let livingBoys = sub[inHospitalSubIndex.living_boys]
      let livingGirls = sub[inHospitalSubIndex.living_girls]
      let miscarriage = sub[inHospitalSubIndex.miscarriage]
      let sb = sub[inHospitalSubIndex.sb]
      let nnm = sub[inHospitalSubIndex.nnm]
      let childDeaths = sub[inHospitalSubIndex.child_deaths]
      let varicellaLastMonth = sub[inHospitalSubIndex.varicella_last_month]
      let cleft = sub[inHospitalSubIndex.cleft]
      let sepsisIndicationsYes = sub[inHospitalSubIndex.number_of_sepsis_indications_that_are_yes]
      let sepsisIndicationsNo = sub[inHospitalSubIndex.number_of_sepsis_indications_that_are_no]
      let sepsisIndicationsDontKnow = sub[inHospitalSubIndex.number_of_sepsis_indications_that_are_dont_know]
      let placeOfBirthOutborn = sub[inHospitalSubIndex.please_select_where_the_baby_was_born]
      let motherAge = sub[inHospitalSubIndex.mother_age]
      let staffIntake = sub[inHospitalSubIndex.staff_intake]
      let typeOfBirth = sub[inHospitalSubIndex.type_of_birth]
      let isTheBabyInborn = sub[inHospitalSubIndex.is_the_baby_inborn] === 'Yes';
  
      
      let currentDate = new Date();
      currentDate.setHours(0,0,0,0)
      
  
      let generatedrefID = generateRefId(intakeDate, entryCountIntakeDate + 1);
      let isMultipleBirth = sub[inHospitalSubIndex.is_this_a_multiple_birth] === 'yes'; //For twin id accounting. If multiple birth is set to yes, it will look for twins
  
      let twinId = 0
      let incrementTwinId = false
      if(isMultipleBirth){ //If the form says "yes" for is multiple birth?
        let enteredTwinId = sub[inHospitalSubIndex.twin_id] //This would be a letter, A, B, C and so on. Each alphabet must correspond to twin ID for all babies of the same mother
        console.log(`Entered Twin Id: ${enteredTwinId}`)
        if(enteredTwinId === undefined || enteredTwinId === "") //Since it is a multiple bith twin ID cannot be blank. Needs to be A, B, C or something
          throw `TwinId missing for ${mother}:${father}, but Multiple birth has been selected as "yes". Check data and run again.`
        if(isNaN(enteredTwinId)){ //isNan is true if the argument passed is a string, so this just checks for that
          let prevEnteredTwinId
          if(prevSub != undefined)
            prevEnteredTwinId = prevSub[inHospitalSubIndex.twin_id]
          else
            prevEnteredTwinId = ""
          console.log(`Previously entered Twin Id: ${prevEnteredTwinId}`)
          if(enteredTwinId === prevEnteredTwinId){ //Then the previous entered twin is same as the current one, it gives it the same id. The data entry operator must enter A for example for both babies and they must be ordered consecutively for the code to work
            twinId = prevEntry[inHospitalMasterIndex.twin_id]
            console.log(`Twin Id entered when equated with the previous one: ${twinId}`)
          } else { //If different we are at the first baby of a set of twins, so it needs to have a new twin Id
            twinId = nextTwinId
            console.log(`Twin Id entered when NOT equated with the previous one: ${twinId}`)
            incrementTwinId = true
          }
        } else {
          twinId = parseInt(enteredTwinId)
        }
      }
      console.log(`Final Twin ID: ${twinId}`)
      // recording birth order
      let birthOrder = "."
      if (isMultipleBirth) {
        birthOrder = sub[inHospitalSubIndex.birth_order_of_a_baby]
        if (birthOrder === "" || birthOrder === undefined) {
          throw `Birth order missing for ${mother}:${father}, but Multiple birth has been selected as "yes". Check data and run again.`
        }
      }
  
      //Recoding last baby fed in months in a single variable
      let monthsFedLastBaby = "."
      let fedLastBabyYears = sub[inHospitalSubIndex.fed_last_baby_years].valueOf()
      let fedLastBabyMonths = sub[inHospitalSubIndex.fed_last_baby_months].valueOf()
      let none = sub[inHospitalSubIndex.isse_pahele_bacche_ko_kinte_mahine_tak_apna_dudh_pilaya] === 'none'; 
      if (!none &&(fedLastBabyYears !== '' || fedLastBabyMonths !== '')) {
        monthsFedLastBaby = (fedLastBabyYears || 0) * 12 + (fedLastBabyMonths || 0)
      }
  
      
      let sncuDurationDays = sub[inHospitalSubIndex.days_stayed_in_sncu]
      let sncuDurationHours = sub[inHospitalSubIndex.hours_stayed_in_sncu]
      let sncuStay = sub[inHospitalSubIndex.has_the_baby_stayed_in_sncu]
      let notesAboutBirth = sub[inHospitalSubIndex.notes_about_birth]
      let notesAboutMotherHealth = sub[inHospitalSubIndex.notes_about_mothers_health]
      let notesAboutDiagnoses = sub[inHospitalSubIndex.notes_about_diagnoses]
  
      let combinedNotes 
      if(notesAboutBirth !=""){
        combinedNotes = "Birth: " + notesAboutBirth +"\n"
      }
      if(notesAboutMotherHealth != ""){
        combinedNotes = "Mother's health: " + notesAboutMotherHealth +"\n"
      }
      if(notesAboutDiagnoses != ""){
        combinedNotes = "Diagnoses: " + notesAboutDiagnoses +"\n"
      }
      if(notes != ""){
        combinedNotes = "Others: " + notes
      }
  
      let gaWeeks = sub[inHospitalSubIndex.ga_weeks].valueOf()
      let gaDays = sub[inHospitalSubIndex.ga_days].valueOf()
  
      //let ca = gaWeeks + Math.floor((age(intakeDate,birthday)+ gaDays)/7);
      let ca = gaWeeks + Math.floor((age(intakeDate,birthday)+3)/7);
      
      //Static Data
      let staticRow = []
      let staticMasterIndex = globalVars.staticMasterIndex
      staticRow[staticMasterIndex.twin_id] = twinId
      staticRow[staticMasterIndex.id_no] = generatedrefID 
      staticRow[staticMasterIndex.mother] = mother
      staticRow[staticMasterIndex.father] = father
      staticRow[staticMasterIndex.birthday] = birthday
      staticRow[staticMasterIndex.female] =  isFemale
      staticRow[staticMasterIndex.phone_numbers] =  allPhoneNumbers
      staticRow[staticMasterIndex.ga_weeks] = gaWeeks
      staticRow[staticMasterIndex.initial_weight] =  initialWeight
      staticRow[staticMasterIndex.date] = intakeDate
      staticRow[staticMasterIndex.mother_age] = motherAge
      staticRow[staticMasterIndex.type_of_birth] = typeOfBirth
      staticRow = completeArray(staticRow,staticMasterIndex)

    globalVars.staticExportable.push(staticRow) //Add to the exportable array for static sheet
      
      //Create a submission row with the same order as the in hospital LBW tracking row (this is robust to LBW tracking changing the ordering of its columns)
      let intakeFormat = []
      let inHospitalMasterIndex = globalVars.inHospitalMasterIndex
    //   intakeFormat[inHospitalMasterIndex.twin_id] = twinId
    //   intakeFormat[inHospitalMasterIndex.id_no] = generatedrefID 
    //   intakeFormat[inHospitalMasterIndex.mother] = mother
    //   intakeFormat[inHospitalMasterIndex.father] = father
    //   intakeFormat[inHospitalMasterIndex.birthday] = birthday
    //   intakeFormat[inHospitalMasterIndex.female] =  isFemale
    //   intakeFormat[inHospitalMasterIndex.phone_numbers] =  phoneNo
    //   intakeFormat[inHospitalMasterIndex.ga_weeks] = gaWeeks
      intakeFormat[inHospitalMasterIndex.corrected_age] = ca
      //intakeFormat[inHospitalMasterIndex.initial_weight] =  initialWeight
      intakeFormat[inHospitalMasterIndex.type_of_form] = typeOfForm
      //intakeFormat[inHospitalMasterIndex.date] = intakeDate
      intakeFormat[inHospitalMasterIndex.where_is_the_baby_now] = intakeWhereIsBaby
      intakeFormat[inHospitalMasterIndex.notes] = combinedNotes
      intakeFormat[inHospitalMasterIndex.living_boys] = livingBoys
      intakeFormat[inHospitalMasterIndex.living_girls] = livingGirls
      intakeFormat[inHospitalMasterIndex.miscarriage] = miscarriage
      intakeFormat[inHospitalMasterIndex.sb] = sb
      intakeFormat[inHospitalMasterIndex.nnm] = nnm
      intakeFormat[inHospitalMasterIndex.child_deaths] = childDeaths
      intakeFormat[inHospitalMasterIndex.varicella_last_month] = varicellaLastMonth
      intakeFormat[inHospitalMasterIndex.cleft] = cleft
      intakeFormat[inHospitalMasterIndex.sepsis_indications_yes] = sepsisIndicationsYes
      intakeFormat[inHospitalMasterIndex.sepsis_indications_no] = sepsisIndicationsNo
      intakeFormat[inHospitalMasterIndex.sepsis_indications_dont_know] = sepsisIndicationsDontKnow
      intakeFormat[inHospitalMasterIndex.place_of_birth] = placeOfBirthOutborn
      //intakeFormat[inHospitalMasterIndex.mother_age] = motherAge
      intakeFormat[inHospitalMasterIndex.staff] = staffIntake
      intakeFormat[inHospitalMasterIndex.ga_days] = gaDays
      intakeFormat[inHospitalMasterIndex.birth_order] = birthOrder
      intakeFormat[inHospitalMasterIndex.months_fed_last_baby] = monthsFedLastBaby
      //intakeFormat[inHospitalMasterIndex.type_of_birth] = typeOfBirth
      intakeFormat[inHospitalMasterIndex.is_the_baby_inborn] = isTheBabyInborn ? 1 : 0
      intakeFormat[inHospitalMasterIndex.any_sncu_stay] = sncuStay
      intakeFormat[inHospitalMasterIndex.days_sncu] = sncuDurationDays
      intakeFormat[inHospitalMasterIndex.hours_sncu] = sncuDurationHours
      
  
  
      intakeFormat = completeArray(intakeFormat,inHospitalMasterIndex)
  
    globalVars.inHospitalExportable.push(intakeFormat) //Add to the exportable array for in hospital
      
      let addressOnIntake = sub[inHospitalSubIndex.address_on_intake]
      let blockOnIntake = sub[inHospitalSubIndex.block]
    

      let intakeFormToaddressTab = []
      let addressMasterIndex = globalVars.addressMasterIndex
      intakeFormToaddressTab[addressMasterIndex.id_no] = generatedrefID
      intakeFormToaddressTab[addressMasterIndex.mother] = mother
      intakeFormToaddressTab[addressMasterIndex.father] = father
      intakeFormToaddressTab[addressMasterIndex.block] = blockOnIntake
      intakeFormToaddressTab[addressMasterIndex.address_intake] = addressOnIntake
  
      intakeFormToaddressTab = completeArray(intakeFormToaddressTab,addressMasterIndex)
  
    globalVars.addressExportable.push(intakeFormToaddressTab) //Add to the exportable array for address
    
    return [incrementTwinId]
  }
  
  function parseCaseSheet(globalVars, sub, latestEntry){
    
      console.log("Parsing Case Sheet")
  
    //Get Data from the google form
      let typeOfForm = sub[inHospitalSubIndex.type_of_form]
      let date = sub[inHospitalSubIndex.date]
      
      date = new Date(date) // Convert date to date object
  
      
      let caseSheetWeight = sub[inHospitalSubIndex.weight_case_sheet]
      let caseSheetTemprature = sub[inHospitalSubIndex.temperature_case_sheet]
      
      let totalKMChours = sub[inHospitalSubIndex.total_kmc_hours]
      let goals = sub[inHospitalSubIndex.goals_and_medicines]
      let notes = sub[inHospitalSubIndex.notes]
      let baTotalCaseSheet = sub[inHospitalSubIndex.ba_total_case_sheet]
      let cupTotalCaseSheet = sub[inHospitalSubIndex.cup_total_case_sheet]
      let iftTotalCaseSheet = sub[inHospitalSubIndex.ift_total_case_sheet]
      let totalConsumedCaseSheet = sub[inHospitalSubIndex.total_consumed_case_sheet]
      let mlExpressedCaseSheet = sub[inHospitalSubIndex.ml_expressed_case_sheet]
      let milkTypeCaseSheet = sub[inHospitalSubIndex.what_milk_is_the_baby_receiving_case_sheet]
  
      let whereIsBaby = sub[inHospitalSubIndex.please_record_the_8am_location_of_the_baby]
      let howIsBabyFeeding = sub[inHospitalSubIndex.what_is_the_morning_feed_mode_case_sheet]
  
  
  
    //Get Data from the latest entry of the baby; this is same information as previous entries
      setStaticInHospital(latestEntry)
      let corrrectedAge = gastestionalAgeStatic + Math.floor((age(date,birthdayStatic)+3)/7)
  
      /*
      // checking if initial weight for this is empty
      let ifInitailWeightEmpty = checkifInitialweightisempty(idNumberStatic, inHospCasesByIds, inHospitalMasterIndex )
      if(ifInitailWeightEmpty == 1 && caseSheetWeight != ""){
        let updateArray =[]
        updateArray[0] = idNumberStatic
        updateArray[1] = caseSheetWeight
        updateIdInitailWeight.push(updateArray)
      }
  
      */
  
    //Get data in the right order
      let formatted  = []
      formatted[inHospitalMasterIndex.twin_id] = twinIDStatic
      formatted[inHospitalMasterIndex.id_no] = idNumberStatic 
      formatted[inHospitalMasterIndex.mother] = motherStatic
      formatted[inHospitalMasterIndex.father] = fatherStatic
      formatted[inHospitalMasterIndex.birthday] = birthdayStatic
      formatted[inHospitalMasterIndex.female] =  isFemaleStatic
      formatted[inHospitalMasterIndex.sncu_id] =  sncuIDStatic
      formatted[inHospitalMasterIndex.phone_numbers] =  phoneNostatic
      formatted[inHospitalMasterIndex.ga_weeks] = gastestionalAgeStatic
      formatted[inHospitalMasterIndex.corrected_age] = corrrectedAge
      formatted[inHospitalMasterIndex.initial_weight] =  initialWeightStatic
      formatted[inHospitalMasterIndex.type_of_form] = typeOfForm
      formatted[inHospitalMasterIndex.date] = date
      formatted[inHospitalMasterIndex.where_is_the_baby_now] = whereIsBaby
      formatted[inHospitalMasterIndex.weight] = caseSheetWeight
      formatted[inHospitalMasterIndex.temperature] = caseSheetTemprature
      formatted[inHospitalMasterIndex.how_is_the_baby_feeding] = howIsBabyFeeding
      
      formatted[inHospitalMasterIndex.total_hours_kmc] = totalKMChours
      formatted[inHospitalMasterIndex.goals_and_medicines] = goals
      formatted[inHospitalMasterIndex.notes] = notes
  
      formatted[inHospitalMasterIndex.ba_total] = baTotalCaseSheet
      formatted[inHospitalMasterIndex.cup_total] = cupTotalCaseSheet
      formatted[inHospitalMasterIndex.ift_total] = iftTotalCaseSheet
      formatted[inHospitalMasterIndex.total_consumed] = totalConsumedCaseSheet
      formatted[inHospitalMasterIndex.ml_expressed] = mlExpressedCaseSheet
      formatted[inHospitalMasterIndex.milk_type] = milkTypeCaseSheet
  
      
      formatted = completeArray(formatted,inHospitalMasterIndex)
  
    inHospitalExportable.push(formatted) //Push to in hospital array for exporting
    
  }
  
  function parseExit(globalVars, sub, latestEntry, lastAddressEntry){
  
    console.log("Parsing Exit")
  
   //Get data from form
    let typeOfForm = sub[inHospitalSubIndex.type_of_form]
    let date =  sub[inHospitalSubIndex.date]
    let babyStatus =  sub[inHospitalSubIndex.baby_status]
    let exitType =  sub[inHospitalSubIndex.where_is_the_baby_today_exit]
    let exitNotes = sub[inHospitalSubIndex.notes]
    let babyCareItems = sub[inHospitalSubIndex.baby_care_items]
    let exitStaff = sub[inHospitalSubIndex.staff]
    let lastWeight = sub[inHospitalSubIndex.last_weight]
    let exitAddress = sub[inHospitalSubIndex.address]
    let caste = sub[inHospitalSubIndex.caste]
    let religion = sub[inHospitalSubIndex.religion]
    let blockExit = sub[inHospitalSubIndex.block_exit]
    //new question
    let statusOfExit = sub[inHospitalSubIndex.status_of_exit]
    let feedMode = sub[inHospitalSubIndex.feed_mode]
    let babyHealth = sub[inHospitalSubIndex.baby_health]
    let nippleType = sub[inHospitalSubIndex.nipple_type]
    let milkSupply = sub[inHospitalSubIndex.milk_supply]
    let hvTiming = sub[inHospitalSubIndex.hv_timing]
    let kmcInTransit = sub[inHospitalSubIndex.kmc_in_transit]
    let opv = sub[inHospitalSubIndex.opv]
    let bcg = sub[inHospitalSubIndex.bcg]
    let hepb = sub[inHospitalSubIndex.hepb]
    let kmcSkills = sub[inHospitalSubIndex.kmc_skills]
    let milkTypeEixt = sub[inHospitalSubIndex.milk_type_exit]
    
    let dateToFollowup = new Date(date);
  
   //Get Data from the latest entry of the baby; this is same information as previous entries
    setStaticInHospital(latestEntry)
    let corrrectedAge = gastestionalAgeStatic + Math.floor((age(date,birthdayStatic)+3)/7)
  
    //july 2023 changes
    /*
    let ifInitailWeightEmpty = checkifInitialweightisempty(idNumberStatic, inHospCasesByIds, inHospitalMasterIndex )
      if(ifInitailWeightEmpty == 1){
        if(lastWeight != ""){
          let updateArray =[]
          updateArray[0] = idNumberStatic
          updateArray[1] = lastWeight
          updateIdInitailWeight.push(updateArray)
        }else if (sncuWeightStatic != ""){
            let updateArray =[]
            updateArray[0] = idNumberStatic
            updateArray[1] = sncuWeightStatic
            updateIdInitailWeight.push(updateArray)
          }
      }
    */
  
  
   //Check which items are given and which are not
    let isScaleGiven  = isBabycareItemGiven("scale",babyCareItems );
    let isThrmoGiven = isBabycareItemGiven("thermometer", babyCareItems);
    let isNiftyGiven = isBabycareItemGiven("nifty", babyCareItems);
    let isKMCWrapGiven = isBabycareItemGiven("KMC kawach", babyCareItems);
    
   //Get data in the right order
    let exitEntryForInHospitalTab = []
    exitEntryForInHospitalTab[inHospitalMasterIndex.twin_id] = twinIDStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.id_no] = idNumberStatic 
    exitEntryForInHospitalTab[inHospitalMasterIndex.mother] = motherStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.father] = fatherStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.birthday] = birthdayStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.female] =  isFemaleStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.sncu_id] =  sncuIDStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.phone_numbers] =  phoneNostatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.ga_weeks] = gastestionalAgeStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.corrected_age] = corrrectedAge
    exitEntryForInHospitalTab[inHospitalMasterIndex.initial_weight] =  initialWeightStatic
    exitEntryForInHospitalTab[inHospitalMasterIndex.type_of_form] = typeOfForm
    exitEntryForInHospitalTab[inHospitalMasterIndex.date] = date
    exitEntryForInHospitalTab[inHospitalMasterIndex.where_is_the_baby_now] = exitType
    exitEntryForInHospitalTab[inHospitalMasterIndex.weight] = lastWeight
    exitEntryForInHospitalTab[inHospitalMasterIndex.notes] = exitNotes
    //new question
    exitEntryForInHospitalTab[inHospitalMasterIndex.status_of_exit] = statusOfExit
    exitEntryForInHospitalTab[inHospitalMasterIndex.feed_mode] = feedMode
    exitEntryForInHospitalTab[inHospitalMasterIndex.baby_health] = babyHealth
    exitEntryForInHospitalTab[inHospitalMasterIndex.nipple_type] = nippleType
    exitEntryForInHospitalTab[inHospitalMasterIndex.milk_supply] = milkSupply
    exitEntryForInHospitalTab[inHospitalMasterIndex.hv_timing] = hvTiming
    exitEntryForInHospitalTab[inHospitalMasterIndex.kmc_in_transit] = kmcInTransit
    exitEntryForInHospitalTab[inHospitalMasterIndex.opv] = opv
    exitEntryForInHospitalTab[inHospitalMasterIndex.bcg] = bcg
    exitEntryForInHospitalTab[inHospitalMasterIndex.hepb] = hepb
    exitEntryForInHospitalTab[inHospitalMasterIndex.kmc_skills] = kmcSkills
    exitEntryForInHospitalTab[inHospitalMasterIndex.milk_type] = milkTypeEixt
    
    exitEntryForInHospitalTab = completeArray(exitEntryForInHospitalTab,inHospitalMasterIndex)
  
    inHospitalExportable.push(exitEntryForInHospitalTab)
  
    let dontFollowHome = sub[inHospitalSubIndex.ghar_pe_nahi_follow_karna]
    console.log(`Don't Follow Home: ${dontFollowHome}`)
    if (exitType != "death" & dontFollowHome != 'Yes'){
      console.log("Exit Entry for Phone Home Tab Added")
      let exitEntryForPhoneHomeTab = []
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.twin_id] = twinIDStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.id_no] = idNumberStatic 
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.mother] = motherStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.father] = fatherStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.birthday] = birthdayStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.female] =  isFemaleStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.sncu_id] =  sncuIDStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.phone_numbers] =  phoneNostatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.ga] = gastestionalAgeStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.ca] = corrrectedAge
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.initial_weight] =  initialWeightStatic
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.date] = date
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.type] = exitType
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.weight] = lastWeight
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.notes] = exitNotes
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.status] = babyStatus
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.baby_care_items] = babyCareItems
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.date_to_follow_up] = dateToFollowup
      exitEntryForPhoneHomeTab[phoneHomeMasterIndex.staff] = exitStaff
  
      exitEntryForPhoneHomeTab = completeArray(exitEntryForPhoneHomeTab,phoneHomeMasterIndex)
  
      phoneHomeExportable.push(exitEntryForPhoneHomeTab)
    }
  
    let intakeAddress = ''
    if(lastAddressEntry !== undefined){
      intakeAddress = lastAddressEntry[addressMasterIndex.address_on_intake]
    }
  
    let exitEntryForAddressTab = []
    exitEntryForAddressTab[addressMasterIndex.id_no] = idNumberStatic
    exitEntryForAddressTab[addressMasterIndex.mother] = motherStatic
    exitEntryForAddressTab[addressMasterIndex.father] = fatherStatic
    exitEntryForAddressTab[addressMasterIndex.block] = blockExit
    exitEntryForAddressTab[addressMasterIndex.address_intake] = intakeAddress
    exitEntryForAddressTab[addressMasterIndex.address_exit] = exitAddress
    exitEntryForAddressTab[addressMasterIndex.scale] = isScaleGiven
    exitEntryForAddressTab[addressMasterIndex.ther] = isThrmoGiven
    exitEntryForAddressTab[addressMasterIndex.nifty] = isNiftyGiven
    exitEntryForAddressTab[addressMasterIndex.kmc_wrap] = isKMCWrapGiven
    exitEntryForAddressTab[addressMasterIndex.caste] =  caste
    exitEntryForAddressTab[addressMasterIndex.religion] = religion
  
    exitEntryForAddressTab = completeArray(exitEntryForAddressTab,addressMasterIndex)
  
    addressExportable.push(exitEntryForAddressTab)
  
  }
  
  function parseReintake(globalVars, sub, latestEntry, latestPhoneHomeEntry){
    
    console.log("Parsing Reintake")
    let inHospitalSubIndex = globalVars.inHospitalSubIndex

    let typeOfForm = sub[inHospitalSubIndex.type_of_form]
    let date = sub[inHospitalSubIndex.date]
    let reintakeWeight = sub[inHospitalSubIndex.weight_reintake]
    let reintakeTemperature = sub[inHospitalSubIndex.temperature_reintake]
    let reintakeWhereBabyIs = sub[inHospitalSubIndex.where_is_the_baby_today_reintake]
    let notes = sub[inHospitalSubIndex.notes]
  
    //setStaticInHospital(latestEntry)
    let correctedAge = gastestionalAgeStatic+ Math.floor((age(date,birthdayStatic)+3)/7)
        
    let reIntakeFormat = []
    let inHospitalMasterIndex = globalVars.inHospitalMasterIndex
    reIntakeFormat[inHospitalMasterIndex.twin_id] = twinIDStatic
    reIntakeFormat[inHospitalMasterIndex.id_no] = idNumberStatic
    reIntakeFormat[inHospitalMasterIndex.mother] = motherStatic
    reIntakeFormat[inHospitalMasterIndex.father] = fatherStatic
    reIntakeFormat[inHospitalMasterIndex.birthday] = birthdayStatic
    reIntakeFormat[inHospitalMasterIndex.female] = isFemaleStatic
    reIntakeFormat[inHospitalMasterIndex.sncu_id] = sncuIDStatic
    reIntakeFormat[inHospitalMasterIndex.phone_numbers] = phoneNostatic
    reIntakeFormat[inHospitalMasterIndex.ga_weeks] = gastestionalAgeStatic
    reIntakeFormat[inHospitalMasterIndex.corrected_age] = correctedAge
    reIntakeFormat[inHospitalMasterIndex.initial_weight] = initialWeightStatic
    reIntakeFormat[inHospitalMasterIndex.type_of_form] = typeOfForm
    reIntakeFormat[inHospitalMasterIndex.date] = date
    reIntakeFormat[inHospitalMasterIndex.where_is_the_baby_now] = reintakeWhereBabyIs
    reIntakeFormat[inHospitalMasterIndex.weight] = reintakeWeight
    reIntakeFormat[inHospitalMasterIndex.temperature] = reintakeTemperature
    reIntakeFormat[inHospitalMasterIndex.notes] = notes
  
    reIntakeFormat = completeArray(reIntakeFormat,inHospitalMasterIndex)
  
    let reIntakePhoneHome = []
    let phoneHomeMasterIndex = globalVars.phoneHomeMasterIndex
    // reIntakePhoneHome[phoneHomeMasterIndex.twin_id] = twinIDStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.id_no] = idNumberStatic 
    // reIntakePhoneHome[phoneHomeMasterIndex.mother] = motherStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.father] = fatherStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.birthday] = birthdayStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.female] =  isFemaleStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.sncu_id] =  sncuIDStatic
    // reIntakePhoneHome[phoneHomeMasterIndex.phone_numbers] =  phoneNostatic
    // reIntakePhoneHome[phoneHomeMasterIndex.ga] = gastestionalAgeStatic
    reIntakePhoneHome[phoneHomeMasterIndex.ca] = correctedAge
    // reIntakePhoneHome[phoneHomeMasterIndex.initial_weight] =  initialWeightStatic
    reIntakePhoneHome[phoneHomeMasterIndex.date] = date
    reIntakePhoneHome[phoneHomeMasterIndex.weight] = reintakeWeight
    reIntakePhoneHome[phoneHomeMasterIndex.temperature] = reintakeTemperature
    reIntakePhoneHome[phoneHomeMasterIndex.notes] = notes
  
    reIntakePhoneHome[phoneHomeMasterIndex.type] = "reIntake"
    reIntakePhoneHome[phoneHomeMasterIndex.baby_care_items] = latestPhoneHomeEntry[phoneHomeMasterIndex.baby_care_items] || "" //If undefined set to blank
    reIntakePhoneHome[phoneHomeMasterIndex.date_to_follow_up] = "in hospital"
  
    reIntakePhoneHome = completeArray(reIntakePhoneHome,phoneHomeMasterIndex)
  
    
    globalVars.inHospitalExportable.push(reIntakeFormat)
    globalVars.phoneHomeExportable.push(reIntakePhoneHome)
  
  }
  
  function parseKmcStepdown(globalVars, sub, latestEntry){
  
    console.log("Parsing KMC Stepdown")
    let inHospitalSubIndex = globalVars.inHospitalSubIndex

    let typeOfForm = sub[inHospitalSubIndex.type_of_form]
    let date = sub[inHospitalSubIndex.date]
    date = new Date(date);
    
    let kmcStepdownWeight = sub[inHospitalSubIndex.weight_kmc_stepdown]
    
    let baTotalKMCStepdown = sub[inHospitalSubIndex.ba_total_kmc_stepdown]
    let cupTotalKMCStepdown = sub[inHospitalSubIndex.cup_total_kmc_stepdown]
    let iftTotalKMCStepdown = sub[inHospitalSubIndex.ift_total_kmc_stepdown]
    let totalConsumedKMCStepdown = sub[inHospitalSubIndex.total_consumed_kmc_stepdown]
    let mlExpressedKMCStepdown = sub[inHospitalSubIndex.ml_expressed_kmc_stepdown]
    //let milkTypeKMCStepdown = sub[inHospitalSubIndex.what_milk_is_the_baby_receiving_kmc_stepdown]
    let howIsBabyFeeding = sub[inHospitalSubIndex.was_feed_started_or_stopped_in_the_morning]
  
  
    let kmcStepdownNotes = sub[inHospitalSubIndex.notes]
  
    setStaticInHospital(latestEntry)
    let corrrectedAge = gastestionalAgeStatic+ Math.floor((age(date,birthdayStatic)+3)/7)
  
     /*
      // checking if initial weight for this is empty
      let ifInitailWeightEmpty = checkifInitialweightisempty(idNumberStatic, inHospCasesByIds, inHospitalMasterIndex )
      if(ifInitailWeightEmpty == 1 && kmcStepdownWeight != ""){
        let updateArray =[]
        updateArray[0] = idNumberStatic
        updateArray[1] = kmcStepdownWeight
        updateIdInitailWeight.push(updateArray)
      }
  
      */
   
    let kmcStepdownFormat = []
    let inHospitalMasterIndex = globalVars.inHospitalMasterIndex
    kmcStepdownFormat[inHospitalMasterIndex.twin_id] = twinIDStatic
    kmcStepdownFormat[inHospitalMasterIndex.id_no] = idNumberStatic
    kmcStepdownFormat[inHospitalMasterIndex.mother] = motherStatic
    kmcStepdownFormat[inHospitalMasterIndex.father] = fatherStatic
    kmcStepdownFormat[inHospitalMasterIndex.birthday] = birthdayStatic
    kmcStepdownFormat[inHospitalMasterIndex.female] = isFemaleStatic
    kmcStepdownFormat[inHospitalMasterIndex.sncu_id] = sncuIDStatic
    kmcStepdownFormat[inHospitalMasterIndex.phone_numbers] = phoneNostatic
    kmcStepdownFormat[inHospitalMasterIndex.ga_weeks] = gastestionalAgeStatic
    kmcStepdownFormat[inHospitalMasterIndex.corrected_age] = corrrectedAge
    kmcStepdownFormat[inHospitalMasterIndex.initial_weight] = initialWeightStatic
    kmcStepdownFormat[inHospitalMasterIndex.type_of_form] = typeOfForm
    kmcStepdownFormat[inHospitalMasterIndex.how_is_the_baby_feeding] = howIsBabyFeeding
    kmcStepdownFormat[inHospitalMasterIndex.date] = date
    kmcStepdownFormat[inHospitalMasterIndex.where_is_the_baby_now] = "SNCU"
    kmcStepdownFormat[inHospitalMasterIndex.weight] = kmcStepdownWeight
    kmcStepdownFormat[inHospitalMasterIndex.notes] = kmcStepdownNotes
    kmcStepdownFormat[inHospitalMasterIndex.ba_total] = baTotalKMCStepdown
    kmcStepdownFormat[inHospitalMasterIndex.cup_total] = cupTotalKMCStepdown
    kmcStepdownFormat[inHospitalMasterIndex.ift_total] = iftTotalKMCStepdown
    kmcStepdownFormat[inHospitalMasterIndex.total_consumed] = totalConsumedKMCStepdown
    kmcStepdownFormat[inHospitalMasterIndex.ml_expressed] = mlExpressedKMCStepdown
  
  
    kmcStepdownFormat = completeArray(kmcStepdownFormat,inHospitalMasterIndex)
  
    globalVars.inHospitalExportable.push(kmcStepdownFormat)
  }
  
  
  
  function setStaticInHospital(latestEntry) {
    
    twinIDStatic = latestEntry[inHospitalMasterIndex.twin_id]
    idNumberStatic = latestEntry[inHospitalMasterIndex.id_no]
    motherStatic = latestEntry[inHospitalMasterIndex.mother]
    fatherStatic = latestEntry[inHospitalMasterIndex.father]
    birthdayStatic = latestEntry[inHospitalMasterIndex.birthday]
    isFemaleStatic = latestEntry[inHospitalMasterIndex.female]
    sncuIDStatic = latestEntry[inHospitalMasterIndex.sncu_id]
    phoneNostatic = latestEntry[inHospitalMasterIndex.phone_numbers]
    gastestionalAgeStatic = latestEntry[inHospitalMasterIndex.ga_weeks]
    initialWeightStatic = latestEntry[inHospitalMasterIndex.initial_weight] 
    //sncuWeightStatic = latestEntry[inHospitalMasterIndex.sncu_weight] 
  }
  
  function capitalizeTwinIds(submissions){
  
    for(let i=0; i<submissions.length;i++)
      submissions[i][inHospitalSubIndex.twin_id] = String(submissions[i][inHospitalSubIndex.twin_id]).toUpperCase()
    return submissions
  }
  
  
  