function recoverData() {
    //call in hospital data and died in asmc 
    let [in_hospital_indices, in_hospital_data] = BahraichApp.getData('IN_HOSPITAL')
    let [diedInASMC_indices, diedInASMC_data] = BahraichApp.getData('DIED_IN_ASMC')
    
    //call in hospital submissions exported 
    let [entry_indices,,,entry_data] = BahraichApp.getData('IN_HOSPITAL_SUBMISSIONS_EXPORTED')
  
    //open target sheet
    var targetSpreadsheet = SpreadsheetApp.openById("1H--424oXG6bEAsz7JmbD09Sd7F6MF5aBi9oJW3g8kks");
    var targetSheet = targetSpreadsheet.getSheetByName('missing data');
  
    //append column headers to the target sheet
    targetSheet.appendRow(['father','id','type of form', 'varicella current', 'varicella missing','notes current', 'notes missing'])
  
    
    //store in hospital ids
    let in_hospital_ids = Object.keys(in_hospital_data) 
    let diedInASMC_ids = Object.keys(diedInASMC_data)
  
    //loop over in hospital submissions exported
    for (let j = 0; j < entry_data.length; j ++) {
      //store needed information
      let date = entry_data[j][entry_indices.date]
      let typ = entry_data[j][entry_indices.type_of_form]
      let bday_entry = entry_data[j][entry_indices.birthday]
      let varicella_missing = entry_data[j][entry_indices.varicella_last_month]
      let mother_missing = entry_data[j][entry_indices.mother]
      let father_missing = entry_data[j][entry_indices.father]
      let notes_about_birth = entry_data[j][entry_indices.notes_about_birth]
      let notes_about_mothers_health = entry_data[j][entry_indices.notes_about_mothers_health]
      let notes_about_diagnoses = entry_data[j][entry_indices.notes_about_diagnoses]
      let notes_missing = entry_data[j][entry_indices.notes]
  
      //reformat the date to compare with ids (since ids begin with YYMMDD, reformatting the date this way can help identify babies)
      let formattedDate = Utilities.formatDate(new Date(date), 'IST', 'yyMMdd');
  
      //concatenate the notes from the in hospital submissions exported
      let combinedNotes = ""
      if(notes_about_birth !=""){
        combinedNotes = combinedNotes + "Birth: " + notes_about_birth +"\n"
      }
      if(notes_about_mothers_health != ""){
        combinedNotes = combinedNotes +  "Mother's health: " + notes_about_mothers_health +"\n"
      }
      if(notes_about_diagnoses != ""){
        combinedNotes = combinedNotes +  "Diagnoses: " + notes_about_diagnoses +"\n"
      }
      if(notes_missing != ""){
        combinedNotes = combinedNotes +  "Others: " + notes_missing
      }
      
      
      //loop in hospital data
      for (let i = 0; i < in_hospital_ids.length; i++) {
        let id = in_hospital_ids[i];
        let caseData = in_hospital_data[id].case_history;
  
        for (let k = 0; k < caseData.length; k++) {
          //store the rows and information needed
          let row = caseData[k];
          let bday = row[in_hospital_indices.birthday]
          let mother = row[in_hospital_indices.mother]
          let father = row[in_hospital_indices.father]
          let type = row[in_hospital_indices.type_of_form];
          let notes = row[in_hospital_indices.notes]
          let varicella = row[in_hospital_indices.varicella_last_month]
  
          //here we need logic for matching the ids to capture the missing information we stored above
          if (typ == type && father.toLowerCase() == father_missing.toLowerCase() && id.substring(0, 6) == formattedDate && mother_missing.toLowerCase() == mother.toLowerCase() && (notes != notes_missing || varicella_missing != varicella)){
            targetSheet.appendRow([father_missing, id, type, varicella, varicella_missing, notes, combinedNotes ]) //return the missing information 
          }
        }
      } 
  
      //loop died IN ASMC data
      for (let i = 0; i < diedInASMC_ids.length; i++) {
        let id = diedInASMC_ids[i];
        let caseData = diedInASMC_data[id].case_history;
  
        for (let k = 0; k < caseData.length; k++) {
          //store the rows and information needed
          let row = caseData[k];
          let bday = row[diedInASMC_indices.birthday]
          let mother = row[diedInASMC_indices.mother]
          let father = row[diedInASMC_indices.father]
          let type = row[diedInASMC_indices.type_of_form];
          let notes = row[diedInASMC_indices.notes]
          let varicella = row[diedInASMC_indices.varicella_last_month]
  
          //here we need logic for matching the ids to capture the missing information we stored above
          if (typ == type && father.toLowerCase() == father_missing.toLowerCase() && id.substring(0, 6) == formattedDate && mother_missing.toLowerCase() == mother.toLowerCase() && (notes != notes_missing || varicella_missing != varicella)){
            targetSheet.appendRow([father_missing, id, type, varicella, varicella_missing, notes, combinedNotes]) //return the missing information 
          }
        }
      }
    } 
  }